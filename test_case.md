# Markdown 全功能测试

## 1. 基础排版 (Basic Layout)

### 标题 (Headers)
# H1 标题
## H2 标题
### H3 标题
#### H4 标题
##### H5 标题
###### H6 标题

### 强调 (Emphasis)
*斜体 (Italic)* 或 _斜体_
**粗体 (Bold)** 或 __粗体__
***粗斜体 (Bold Italic)***
~~删除线 (Strikethrough)~~

### 引用 (Blockquote)
> 这是一个一级引用
>> 这是一个二级引用
> > 这是一个嵌套引用

### 分隔线 (Horizontal Rules)
---

### 脚注 (Footnotes)
这是一个包含脚注的句子[^1]。

[^1]: 这是脚注的具体内容。

## 2. 列表 (Lists)

### 无序列表 (Unordered)
- 项目 1
- 项目 2
  - 子项目 2.1
  - 子项目 2.2
    - 子项目 2.2.1

### 有序列表 (Ordered)
1. 第一项
2. 第二项
   1. 第二项的子项 A
   2. 第二项的子项 B

### 任务列表 (Task Lists - GFM)
- [ ] 支持流式渲染
- [x] 支持 GFM 语法
- [x] 支持公式

## 3. 代码 (Code)

### 行内代码 (Inline Code)
使用 `console.log()` 输出信息。

### 围栏代码块 (Fenced Code Blocks)
```javascript
function hello() {
  console.log("Hello, World!");
  return true;
}
```

```python
def hello():
    print("Hello, World!")
    return True
```

## 4. 表格 (Tables - GFM)

| 左对齐 (Left) | 居中对齐 (Center) | 右对齐 (Right) |
| :--- | :---: | ---: |
| 单元格 1 | 单元格 2 | $1600 |
| col 2 is | centered | $12 |
| zebra stripes | are neat | $1 |

## 5. 链接与图片 (Links & Images)

### 链接
[飞书](https://www.feishu.cn)
[GitHub](https://github.com)

### 图片
![本地SVG示例](/local-test.svg)

## 6. 数学公式 (Math - KaTeX)

### 行内公式
质能方程 $E=mc^2$ 是物理学中最著名的公式之一。

### 块级公式
$$
f(x) = \int_{-\infty}^\infty \hat f(\xi)\,e^{2\pi i \xi x} \,d\xi
$$
质能方程 $E=mc^2$ 是物理学中最著名的公式之一。

## 7. 扩展语法 (Extensions)
### 剧透/黑幕 (Spoiler)
!!! 悬停查看隐藏内容 !!!

## 8. 语法修复测试 (Syntax Repair)
### 未闭合的代码块
```javascript
// 这是一个未闭合的代码块
if (true) {
  console.log("Unclosed");

### 未闭合的表格
| 标题1 | 标题2 |
| --- | --- |
| 内容1 | 内容2

### 未闭合的公式
$$
\sum_{i=1}^n i = \frac{n(n+1)}{2}

### 未闭合的行内代码
这是一个`未闭合的行内代码片段

### 未闭合的链接
[飞书](https://www.feishu.cn

### 未闭合的图片
![本地SVG示例](/local-test.svg

## 9. 长段落文本 (平滑效果)
这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。这是一段较长的文本。

## 10. 尾包性能测试 (Tail Packet Test)
```javascript
function hello() {
  console.log("Hello, World!");
  return true;
}
function hello() {
  console.log("Hello, World!");
  return true;
}
function hello() {
  console.log("Hello, World!");
  return true;
}
function hello() {
  console.log("Hello, World!");
  return true;
}
function hello() {
  console.log("Hello, World!");
  return true;
}
function hello() {
  console.log("Hello, World!");
  return true;
}
function hello() {
  console.log("Hello, World!");
  return true;
}
function hello() {
  console.log("Hello, World!");
  return true;
}
function hello() {
  console.log("Hello, World!");
  return true;
}

function hello() {
  console.log("Hello, World!");
  return true;
}
function hello() {
  console.log("Hello, World!");
  return true;
}
function hello() {
  console.log("Hello, World!");
  return true;
}
```


