export const name = 'disable-preset-plugins';
export const inject = ['agentPresets'];

export const Config = {
  type: 'object',
  dict: {
    disabled: {
      type: 'array',
      description: '要在预设中全局禁用的插件包名（name）或条目 ID（id）'
    },
    presets: {
      type: 'dict',
      description: '针对特定预设模式（如 standard, ptc, minimal）的单独禁用列表'
    }
  },
  '~standard': {
    version: 1,
    vendor: 'dsh-disable-preset-plugins',
    validate(value) {
      return { value: value || {} };
    }
  }
};

/**
 * 规范化配置规则
 * 支持从 Loader config 接收：
 * - config.disabled: ['plugin-a', 'plugin-b']
 * - config 直接为数组: ['plugin-a', 'plugin-b']
 * - config.presets: { standard: ['plugin-a'], ptc: [...] }
 */
function normalizeRules(config) {
  if (!config) {
    return { globalDisabled: new Set(), presetDisabled: new Map() };
  }

  let globalList = [];
  if (Array.isArray(config)) {
    globalList = config;
  } else if (Array.isArray(config.disabled)) {
    globalList = config.disabled;
  } else if (Array.isArray(config.disabledPlugins)) {
    globalList = config.disabledPlugins;
  }

  const globalDisabled = new Set(globalList.map(s => String(s).trim()).filter(Boolean));
  const presetDisabled = new Map();

  if (config.presets && typeof config.presets === 'object') {
    for (const [presetId, list] of Object.entries(config.presets)) {
      if (Array.isArray(list)) {
        presetDisabled.set(
          presetId,
          new Set(list.map(s => String(s).trim()).filter(Boolean))
        );
      }
    }
  }

  return { globalDisabled, presetDisabled };
}

/**
 * 判定插件行是否命中禁用规则
 */
function isTargetPlugin(row, presetId, rules) {
  if (!row || typeof row !== 'object') return false;
  const name = row.name ? String(row.name).trim() : '';
  const id = row.id ? String(row.id).trim() : '';

  // 1. 全局禁用规则匹配（匹配 package name 或 row id）
  if (rules.globalDisabled.has(name) || rules.globalDisabled.has(id)) {
    return true;
  }

  // 2. 特定预设禁用规则匹配
  if (presetId && rules.presetDisabled.has(presetId)) {
    const specific = rules.presetDisabled.get(presetId);
    if (specific.has(name) || specific.has(id)) {
      return true;
    }
  }

  return false;
}

/**
 * 递归遍历预设的 plugins 列表并置为 disabled: true
 */
function applyDisableToPlugins(plugins, presetId, rules) {
  if (!Array.isArray(plugins)) return;
  for (const row of plugins) {
    if (!row || typeof row !== 'object') continue;
    if (row.group === true && Array.isArray(row.config)) {
      applyDisableToPlugins(row.config, presetId, rules);
    } else if (isTargetPlugin(row, presetId, rules)) {
      row.disabled = true;
    }
  }
}

export function apply(ctx, config) {
  const rules = normalizeRules(config);

  // 若未配置任何禁用规则，直接保持原样
  if (rules.globalDisabled.size === 0 && rules.presetDisabled.size === 0) {
    return;
  }

  // 1. 拦截预设注册：当预设通过 agentPresets 注册时，将命中配置的插件标记为 disabled: true
  const originalRegister = ctx.agentPresets.register;
  ctx.agentPresets.register = function (definition) {
    if (definition?.plugins) {
      applyDisableToPlugins(definition.plugins, definition.id, rules);
    }
    return originalRegister.call(this, definition);
  };

  // 2. 生命周期清理：当插件被停用或重载时还原原生方法，避免猴子补丁残留
  ctx.on('dispose', () => {
    ctx.agentPresets.register = originalRegister;
  });

  // 3. 兼容热重载：若加载时预设已在内存中，将其配置中命中规则的插件同步置为 disabled: true
  if (ctx.agentPresets?.definitions) {
    for (const [id, record] of ctx.agentPresets.definitions.entries()) {
      if (record?.config?.plugins) {
        applyDisableToPlugins(record.config.plugins, id, rules);
      }
    }
  }
}
