# ManJu 图标重新整理包

本包基于重新上传的 `漫剧源文件 (1).zip` 重新整理。

## 目录

- `iconfont_input/`：适合转为 iconfont 的纯图标 SVG。已尽量去掉按钮背景、文本、复杂组件。
- `svg_currentcolor/`：同一批纯图标的 `currentColor` SVG，可直接做 `AppIcon`。
- `svg_only/separated/`：从组合图标里拆出的 SVG，例如积分菱形和购物车。积分菱形保留渐变，建议继续 SVG。
- `svg_only/with_text_originals/`：带文字或整组按钮/tooltip 的原始 SVG，不建议转 iconfont，应拆为图标 + HTML 文本。
- `svg_only/components/`：复杂组件或背景块，保留 SVG/CSS。
- `text_separated/`：文字标签 SVG，仅作为来源核对；实际请用 HTML 文本。
- `registry/icon-manifest.json`：图标名、来源文件、分类、处理理由。
- `registry/iconfont-names.ts`：iconfont 输入图标名类型。
- `package.iconfont-build.json`：本地生成 iconfont 的示例 package 配置。

## 重要说明

1. 带文字的对象已经分离到 `text_separated/` 或 `svg_only/with_text_originals/`，不放入 iconfont。
2. 顶部积分/购物车组合已拆分：
   - `topbar-credit-diamond-default.svg` / `topbar-credit-diamond-active.svg`：保留渐变，建议 SVG。
   - `topbar-cart-default.svg` / `topbar-cart-active.svg`：已放入 iconfont 输入源。
   - 数字 `0` 和 `+` 请用 HTML 文本渲染。
3. 过于复杂、多色、带滤镜或带文字的对象保留 SVG，不强制转字体。
4. 本包不包含编译后的 ttf/woff/woff2 字体文件；可用 `iconfont_input/` 在本地生成。

## 本地生成 iconfont

```bash
cp package.iconfont-build.json package.json
npm install
npm run build:iconfont
```

生成后把 `dist-iconfont/` 里的字体和 CSS 移入项目，例如：

```text
src/assets/iconfont/
  fonts/
  manju-icons.css
```

## 推荐页面使用方式

- 简单功能图标：使用 iconfont 或 `svg_currentcolor/`。
- 复杂渐变图标：使用 `svg_only/separated/` 或 `svg_only/components/`。
- 按钮文字、tooltip 文字、导航文字：使用 HTML 文本 + CSS，不使用图标字体。
