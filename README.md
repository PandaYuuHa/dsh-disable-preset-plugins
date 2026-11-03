# @pandayuuha/dsh-disable-preset-plugins

通用 DeepSeek Harness (DSH) Agent 预设插件禁用器。

允许您在保持原生预设（如标准模式 `standard`、PTC 模式 `ptc`、极简模式 `minimal`）完整不变的前提下，通过 Profile 的 `cordis.patch.yml` 配置文件列表将指定的内置插件标记为禁用状态（`disabled: true`），完全不破坏已有插件对原生 Agent 模式的依赖。

---

## 安装方法

### 在 DeepSeek Harness 网页版或桌面版中安装

在 **添加插件** 向导的搜索框中填写 `@pandayuuha/dsh-disable-preset-plugins`，然后点击 **安装**。

### 使用 dsh CLI

安装 `@pandayuuha/dsh-disable-preset-plugins` 插件：

```bash
# 桌面版
dsh plugin --profile desktop add @pandayuuha/dsh-disable-preset-plugins

# 网页版
dsh plugin --profile web add @pandayuuha/dsh-disable-preset-plugins
```

更新 `@pandayuuha/dsh-disable-preset-plugins` 插件：

```bash
# 桌面版
dsh plugin --profile desktop update @pandayuuha/dsh-disable-preset-plugins@latest

# 网页版
dsh plugin --profile web update @pandayuuha/dsh-disable-preset-plugins@latest
```

---

## 配置方法 (在 Profile 的 `cordis.patch.yml` 中)

插件本身不带有任何写死的业务配置。您只需在当前 DSH Profile 的配置文件（例如 `~/.dsh/profiles/<profile-name>/cordis.patch.yml`）中添加对应的配置项即可：

```yaml
- id: disable-preset-plugins
  config:
    # 1. 全局禁用：在此列出的插件将在所有 Agent 预设中被标记为 disabled
    disabled:
      - "example-plugin-package"  # 插件包名样例，例如 "@deepseek-ai/dsh-time-context"
      - "example-plugin-id"       # 插件条目 ID 样例，例如 "time-context"

    # 2. 按模式精确禁用：针对标准模式(standard)、PTC模式(ptc)、极简模式(minimal)单独指定禁用项
    presets:
      standard:
        - "plugin-only-disabled-in-standard"
      ptc:
        - "plugin-only-disabled-in-ptc"
      minimal:
        - "plugin-only-disabled-in-minimal"
```

---

## 支持的原生模式标识 (Preset IDs)

| 模式中文名 | Preset ID |
| :--- | :--- |
| **标准模式** | `standard` |
| **PTC 模式** | `ptc` |
| **极简模式** | `minimal` |

---

## 特性

1. **纯粹原生**：保留原插件条目并将属性置为 `disabled: true`，Cordis Loader 自动跳过挂载。
2. **零侵入**：不改变预设的模式 ID，不影响任何其他针对原生模式编写的业务插件。
3. **规范生命周期**：支持 `dispose` 自动还原，卸载或重载时零状态残留。
4. **支持定向控制**：支持全局批量禁用，也支持按 `standard`、`ptc`、`minimal` 等模式精确定向禁用。

---

## 开源许可

[MIT License](./LICENSE)
