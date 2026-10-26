# 光谱显示色数据

`CIE_xyz_1931_2deg.csv` 与同名元数据来自 International Commission on Illumination (CIE)。

- CIE 2019, *Colour-matching functions of CIE 1931 standard colorimetric observer*.
- DOI: https://doi.org/10.25039/CIE.DS.xvudnb9b
- 原始下载页：https://cie.co.at/datatable/cie-1931-colour-matching-functions-2-degree-observer
- 原始表格：CIE 018:2019, Table 6；360–830 nm，1 nm 步长。
- 原始数据 SHA-256：`fa663e3535a7e0763a745993a1f0a192eb0275ac46ad2d1befd7626841e713c1`。
- 许可：Creative Commons Attribution-ShareAlike 4.0 International，https://creativecommons.org/licenses/by-sa/4.0/ 。原文件保留未修改。

`src/ui/spectrum-data.js` 是从该 CSV 派生的 JSON 数组，按同一 CC BY-SA 4.0 许可使用，保留上述出处。本说明只覆盖这些颜色数据，不替代项目代码或原子数据的许可决定。

界面将单色 XYZ 经 sRGB 矩阵和传递函数转换，截去显示器色域外的负通道并归一化显示亮度。转换依据：https://www.w3.org/Graphics/Color/srgb 。屏幕颜色是近似标识，不表示真实激光亮度，也无法准确重现所有单色光。界面使用 380–780 nm 作为可见区的显示约定，范围外以中性色及 UV/IR 文字标识。
