# OCR 失败与降级记录

- 原始文件：`acwing/算法基础课模板大全-C++版本.pdf`。
- 尝试：按 `pdf2md-agent-skill` 的中文 PDF 流程请求 OCR。
- 结果：Ark 返回 `AuthenticationError: The API key format is incorrect`（HTTP 401）。
- 已采取措施：使用 PyMuPDF 生成 `算法基础课模板大全-C++版本.pymupdf.md` 作为有限文本证据，并提取页面图片。
- 禁止外推：不把公式、图片、页码版面或代码缩进视为已完整核实；不重复进行同一失败 OCR 请求。
- 后续升级条件：有效 OCR 凭证或人工逐页复核，并重新记录来源、页码和结论。
