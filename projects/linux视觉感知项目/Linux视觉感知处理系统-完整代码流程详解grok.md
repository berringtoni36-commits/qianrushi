# Linux 视觉感知处理系统 —— 完整代码流程详解（逐行精读版）

> 本文按**真实运行顺序**串起全项目代码。  
> **文首是总调用图**（先建立全局）。  
> **后文对关键函数尽量逐行解释**：每一行在干什么、数据变成什么、谁调用谁。  
> 源码以仓库为准；路径写死、已知坑会标明。

---

# 〇、总调用图（先看这里）

下面几张图从粗到细。建议：**先整机总图 → 再 Qt 事件图 → 再算法批处理 → 再 LIME/LSTR/Unet 内部**。

---

## 图 0-A：整机双进程总览（最宏观）

```text
╔══════════════════════════════════════════════════════════════════════════╗
║                         用户（鼠标 / 摄像头 / 视频）                        ║
╚════════════════════════════════════╤═════════════════════════════════════╝
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 进程 A：Qt 上位机  Lane_Detection                                          │
│ 文件：main.cpp → MainWindow(mainwindow.cpp) → a.exec() 事件循环            │
│                                                                            │
│  ┌─ 开摄像头 ─┐    ┌─ 选视频 ─┐    ┌─ 点识别 ─┐    ┌─ 每秒定时 ─┐          │
│  │Open 按钮   │    │result按钮│    │yolop按钮 │    │timer2     │          │
│  └─────┬──────┘    └────┬─────┘    └────┬─────┘    └─────┬─────┘          │
│        ▼                ▼               ▼                ▼               │
│  on_Open_triggered  on_Select_      yolop_process   timerTimeOut         │
│  timer→readFrame    triggered       process2.write  sysinfo CPU/内存     │
│  写 frames/*.jpg    process3:ffmpeg 启动 ./LSTR      QChart 刷新          │
│  cameraView显示     抽帧+播放预览    读 result 显示                        │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │ stdin 命令（异步）
                                    │   cd .../LSTR/build
                                    │   ./LSTR ../videos/frames/
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 进程 B：./LSTR（算法可执行文件）                                            │
│ 文件：上位机程序/Lane_Detection/LSTR/main.cpp                               │
│                                                                            │
│  main()                                                                    │
│    LSTR mynet;     ──────────构造时只做一次──────────┐                      │
│    for i=1,2,3...:                                 │                      │
│      imread(frames/i.jpg)                          │                      │
│      resize → 360×204                              ▼                      │
│      lime->enhance(d)  ──► LIME 全套（见 图0-D）   Session(onnx)           │
│      mynet.detect(d)   ──► LSTR 推理（见 图0-E）   log_space.bin           │
│      imwrite(result/i.jpg)                                                │
│      cout 进度 ──► 被进程A textBrowser 显示                                 │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │ 磁盘 result/*.jpg
                                    ▼
                          进程 A：resultView 轮播显示
```

**一句话**：Qt 不管卷积；`./LSTR` 里对每张图先 **LIME 增强** 再 **ONNX 检测**；结果用图片文件交回 Qt。

---

## 图 0-B：从「点识别」到「屏幕出图」的完整调用链（函数级）

```text
[用户点击 ui->yolop_process]
        │
        ▼
MainWindow::yolop_process()                          【mainwindow.cpp】
        │
        ├─① process2->write("cd .../LSTR/build\n")
        │     └─ QProcess(bash) 收到 cd 命令
        │
        ├─② process2->write("./LSTR ../videos/frames/\n")
        │     └─ bash 执行 ./LSTR，argv[1]="../videos/frames/"
        │           │
        │           ▼
        │     ════════ 进入进程 B：LSTR::main ════════
        │     main(argc, argv)                       【LSTR/main.cpp】
        │           │
        │           ├─ LSTR::LSTR() 构造
        │           │     ├─ new Ort::Session(lstr_360x640.onnx)
        │           │     ├─ 解析 input/output 名字与 shape
        │           │     ├─ mask_tensor 全 0
        │           │     └─ fread(log_space.bin) 50 floats
        │           │
        │           └─ for i = 1, 2, 3, ... until 读图失败
        │                 │
        │                 ├─ imread(folder + i + ".jpg") → Mat m
        │                 ├─ resize(m, d, 360×204)
        │                 ├─ l = new LIME::lime(d)
        │                 │         └─ 只保存 channel 数
        │                 │
        │                 ├─ d = l->enhance(d)        ──── 展开见 图0-D
        │                 │
        │                 ├─ dst = mynet.detect(d)    ──── 展开见 图0-E
        │                 │
        │                 ├─ imwrite("../result/"+i+".jpg", dst)
        │                 └─ delete l
        │
        ├─③ waitKey(10000)   // 粗暴等 10 秒（阻塞 UI）
        │
        └─④ for i=1..∞
              imread(result/i.jpg)
              空则 break
              MatImageToQt → resultView->setPixmap
              waitKey(100)
```

---

## 图 0-C：Qt 启动与事件循环（进程 A 内部）

```text
操作系统启动可执行文件
        │
        ▼
main()  【Lane_Detection/main.cpp】
  L1  QApplication a(argc,argv)     // 创建 Qt 应用单例
  L2  MainWindow w;                 // ★ 立刻跑完整构造函数
  L3  w.show()                      // 窗口标记为可见
  L4  return a.exec()               // ★ 进入事件循环，直到退出
        │
        │  事件循环内部不断：
        │    取事件 → 若匹配信号 → 调用已 connect 的槽
        ▼
MainWindow::MainWindow()  构造期只执行一次
  ├─ ui->setupUi(this)              // 创建所有控件
  ├─ QFileSystemModel 挂 result 目录
  ├─ new QTimer timer, timer2
  ├─ new QProcess process2, process3
  ├─ process2/3->start("bash")      // 两个常驻 shell
  ├─ timer2->start(1000)            // 监控开始跳
  ├─ connect 七组信号槽（见下表）
  └─ InitChart()

connect 表（构造里绑定，之后靠事件触发）：
  timer.timeout          ──────────► readFrame()
  Open.clicked           ──────────► on_Open_triggered()
  Stop.clicked           ──────────► on_Stop_triggered()
  result.clicked         ──────────► on_Select_triggered()
  yolop_process.clicked  ──────────► yolop_process()
  process2.readyRead...  ──────────► readBashStandardOutputInfo()
  timer2.timeout         ──────────► timerTimeOut()
```

### 摄像头支路调用图

```text
点击 Open
  → on_Open_triggered()
       cap.open(0)
       timer->start(3)          // 每 3ms 可能触发一次
       t=计时起点; count=0
  → （事件循环）
  → timer timeout
  → readFrame()
       cap.read(src_image)
       MatImageToQt → cameraView 显示
       resize 320×240 → imwrite(frames/count.jpg)
       count++
点击 Stop
  → on_Stop_triggered()
       timer->stop(); cap.release(); 统计时长与张数
```

### 视频支路调用图

```text
点击 result（选视频）
  → on_Select_triggered()
       若摄像头开着 → 警告 return
       文件对话框 → filename2
       process3->write("cd .../LSTR/videos/")
       process3->write("ffmpeg -i test.mp4 -vf fps=10 frames/%d.jpg")
       waitKey(2000)
       QMediaPlayer 播放 filename2（仅预览，不进网络）
```

### 监控支路调用图

```text
每秒 timer2
  → timerTimeOut()
       sysinfo.cpuLoadAverage()     // cat /proc/stat 差分
       sysinfo.get_mem_usage__()    // free -m
       receivedData_cpu / receivedDate_mem  // 刷新 QChart
```

---

## 图 0-D：LIME::enhance 内部完整调用树

```text
l->enhance(d)                         【lime.cpp / 集成 lime】
 │
 ├─① _init_IllumMap(src)
 │     convertTo img_norm = src/255     // u8 → float[0,1]
 │     row,col = 尺寸
 │     T_hat = getMax(img_norm)         // 每像素 max(R,G,B)
 │         └─ split 三通道
 │         └─ 双重循环 或 (加速版) OpenMP四象限 + NEON vmax
 │     epsilon = Frobenius(T_hat)*0.001
 │         └─ Σx² 再 sqrt（原版）
 │     dv = Dev(row,1); dh = Dev(col,-1)
 │     初始化 veCDD 若干系数
 │
 ├─② split(img_norm) → g,b,r 三通道
 │
 ├─③ T = optIllumMap()
 │     weightStrategy()
 │         dTv=dv*T_hat; dTh=T_hat*dh
 │         W = 1/(|dT|+1) 拼垂直水平
 │     T,G,Z 置0; u=1; t=0
 │     while true:
 │         T = solveT(G,Z,u)
 │             X=G-Z/u → 差分组合 → Mat2Vec
 │             dft 分子/分母 → getReal → dft 回来
 │             normalize(T, 0.2, 1)      // 防 T≈0
 │             reshape1D → HxW 的 T
 │         G = solveG(T,Z,u,W)
 │             dT=derivative(T)
 │             soft-threshold(|X|-αW/u)
 │         Z = solveZ(T,G,Z,u)          // Z+u*(dT-G)
 │         u = solveU(u)                // u*rho
 │         t==0 时 thd = ceil(2*log(‖dT-G‖/ε))
 │         t++; if t>=thd break
 │     return T
 │
 ├─④ g1=g/T; b1=b/T; r1=r/T
 │     （加速版：三通道 OpenMP sections 并行）
 │     threshold 去负值等
 │
 ├─⑤ merge → out_lime
 └─⑥ convertTo CV_8U *255 → return
```

**数据主线**：

```text
u8 BGR → float[0,1] → T_hat → 迭代得 T → 通道/T → u8 增强图
```

---

## 图 0-E：LSTR::detect 内部完整调用树

```text
mynet.detect(d)                       【LSTR/main.cpp】
 │
 ├─ 保存 img_height, img_width          // 增强图尺寸，后面还原坐标用
 ├─ resize → inpW×inpH                  // 从 onnx 读的，如 640×360
 ├─ normalize_(dstimg)
 │     三重循环 c,i,j
 │     pix = BGR 字节
 │     out[c*H*W+i*W+j] = (pix/255-mean)/std   // CHW + ImageNet
 │
 ├─ CreateTensor 图像 [1,3,H,W]
 ├─ CreateTensor mask  [1,1,H,W] 全0
 │
 ├─ ort_session->Run(...)
 │     → pred_logits   // 候选分类分数
 │     → pred_curves   // 曲线参数
 │
 ├─ for 每个候选 i:
 │     argmax_j logits[i,j] → max_id
 │     if max_id==1: 有效
 │         for k=0..49:
 │           y = p0 + log_space[k]*(p1-p0)
 │           x = p2/(y-p3)^2 + p4/(y-p3) + p5 + p6*y - p7
 │           Point(x*W0, y*H0)
 │
 ├─ query id 0→右, 5→左
 ├─ 若左右都有: 拼多边形 fillConvexPoly 绿 + addWeighted
 ├─ 所有点 circle 上色
 └─ return 可视化图
```

---

## 图 0-F：Unet 独立路径（不经 Qt 默认按钮）

```text
./unet_ncnn image.jpg                 【Unet_NCNN/src/unet.cpp】
  load_param / load_model
  imread
  copyMakeBorder 补正方形
  映射 pad 到 720 坐标
  resize 720×720 → /255
  HWC→CHW 手动重排
  Extractor: input("in0") → extract("out0")
  每像素 argmax → 去 pad → 涂绿 → result.jpg
```

---

## 图 0-G：一张图在内存里的尺寸/类型变化（整机主路径）

```text
磁盘 frames/i.jpg
    │ imread
    ▼
Mat m : H×W×3  BGR  uint8          （原视频帧）
    │ resize Size(360,204) 注意是宽360高204
    ▼
Mat d : 204×360×3  BGR  uint8
    │ enhance
    │   内部 float 运算，最后 *255
    ▼
Mat d : 204×360×3  BGR  uint8      （增强后）
    │ detect
    │   记住 H0=204, W0=360
    │   resize → 约 360×640（H×W，以 onnx 为准）
    │   float CHW 长度 3*H*W
    │   Run → logits, curves
    │   点坐标乘回 H0,W0，画在 srcimg 上
    ▼
Mat dst : 204×360×3  BGR  uint8    （带车道可视化）
    │ imwrite
    ▼
磁盘 result/i.jpg
    │ Qt imread + MatImageToQt
    ▼
QImage → resultView 屏幕
```

---

## 图 0-H：模块依赖与「谁链接谁」

```text
Lane_Detection (qmake)
  ├─ Qt Widgets/Charts/Multimedia
  ├─ OpenCV (VideoCapture, imread, Mat↔显示)
  └─ 不链接 ncnn/onnx（只 QProcess 调外部程序）

LSTR 可执行文件 (CMake)
  ├─ OpenCV
  ├─ ONNX Runtime  (libonnxruntime.so)
  ├─ LIME 源码/头   (enhance)
  └─ 可选 OpenMP/NEON（若用加速 LIME）

Unet_ncnn (CMake，独立)
  ├─ OpenCV
  └─ libncnn.a

Lime / Lime_NEON+OpenMP (CMake，独立 demo)
  ├─ OpenCV
  └─ OpenMP + arm_neon.h（加速版）
```

---

## 如何用本文深入学习

| 顺序 | 读什么 | 目的 |
|------|--------|------|
| 1 | 上面全部总图 | 建立「电影剧本」 |
| 2 | 第一部分 Qt 逐行 | 懂事件如何触发算法 |
| 3 | 第二部分 LSTR main 逐行 | 懂批处理如何串 LIME+检测 |
| 4 | 第三部分 LIME 逐行 | 懂增强内部 |
| 5 | 第四部分 detect 逐行 | 懂 ONNX 与后处理 |
| 6 | 第五部分 加速 / 第六部分 Unet | 扩展 |

---

# 第一部分：Qt 上位机 —— 逐行精读

## 1.1 main.cpp 全文逐行

`[源文件]` `上位机程序/Lane_Detection/main.cpp`

### 完整代码（带行号）

```cpp
1  #include "mainwindow.h"
2  #include <QApplication>
3
4  int main(int argc, char *argv[])
5  {
6      QApplication a(argc, argv);
7      MainWindow w;
8      w.show();
9
10     return a.exec();
11 }
```

### 逐行解释

| 行 | 代码 | 逐行说明 |
|----|------|----------|
| 1 | `#include "mainwindow.h"` | 引入主窗口类声明。编译器由此知道 `MainWindow` 有哪些槽、成员。 |
| 2 | `#include <QApplication>` | Qt 应用程序类：事件循环、全局应用状态。 |
| 4 | `int main(int argc, char *argv[])` | 程序入口。`argc/argv` 传给 Qt 解析如 `-style` 等参数。 |
| 6 | `QApplication a(argc, argv);` | **必须先有** QApplication，才能创建窗口。对象 `a` 在整个进程生命周期存在（直到 main 结束）。内部会初始化 GUI 子系统。 |
| 7 | `MainWindow w;` | **栈上构造**主窗口。C++ 在此行**同步执行完整个构造函数**（创建 UI、QProcess、connect…）。构造失败会抛异常/直接崩，不会进事件循环。 |
| 8 | `w.show();` | 把窗口设为可见。此时可能还没真正画完，真正绘制在事件循环处理 `QPaintEvent` 时。 |
| 10 | `return a.exec();` | **进入事件循环**：线程阻塞在这里。循环伪代码：`while (还有窗口) { 取事件; 分发到对象; }`。返回值是应用退出码。没有这行，main 结束→析构 w→进程退出→窗口闪退。 |

### 调用关系

```text
OS → main
      → QApplication 构造
      → MainWindow 构造（见 1.2）
      → show
      → exec ──┬→ 用户点击 → 某 slot
               ├→ 定时器 → readFrame / timerTimeOut
               └→ 进程输出 → readBashStandardOutputInfo
```

---

## 1.2 MainWindow 构造函数 —— 分段逐行

`[源文件]` `mainwindow.cpp` 构造函数

### 完整代码

```cpp
MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    m_model = new QFileSystemModel;
    QString path = "/home/kylin/桌面/project_v1.0/LSTR/result/";
    m_model->setRootPath(path);
    ui->treeView->setModel(m_model);
    ui->treeView->setRootIndex(m_model->index(path));

    timer = new QTimer(this);
    timer2 = new QTimer(this);
    process2 = new QProcess;
    process3 = new QProcess;
    process2->start("bash");
    process3->start("bash");
    process2->waitForStarted();
    process3->waitForStarted();

    timer2->start(1000);

    connect(timer, SIGNAL(timeout()), this, SLOT(readFrame()));
    connect(ui->Open, SIGNAL(clicked()), this, SLOT(on_Open_triggered()));
    connect(ui->Stop, SIGNAL(clicked()), this, SLOT(on_Stop_triggered()));
    connect(ui->result, SIGNAL(clicked()), this, SLOT(on_Select_triggered()));
    connect(ui->yolop_process, SIGNAL(clicked()), this, SLOT(yolop_process()));
    connect(process2, SIGNAL(readyReadStandardOutput()), this, SLOT(readBashStandardOutputInfo()));
    connect(timer2, SIGNAL(timeout()), this, SLOT(timerTimeOut()));

    InitChart();
    setWindowTitle("神经网络车道线识别系统");
}
```

### 初始化列表逐行

| 代码 | 说明 |
|------|------|
| `QMainWindow(parent)` | 调用父类构造，嵌入 Qt 对象树，`parent` 负责生命周期时有用。 |
| `ui(new Ui::MainWindow)` | 堆上创建 Designer 生成的 UI 对象，后面 `setupUi` 用。 |

### 函数体逐行

| 代码 | 说明 |
|------|------|
| `ui->setupUi(this)` | 根据 `.ui` 文件创建按钮、Label、ChartView、TreeView 等，全部以 `this` 为父窗口布局好。**之后才能** `ui->Open`。 |
| `m_model = new QFileSystemModel` | 文件系统模型，把磁盘目录映射成树。 |
| `path = "/home/kylin/.../result/"` | **写死的结果目录**。换机器必改。 |
| `setRootPath(path)` | 模型监控该路径。 |
| `treeView->setModel` | 树控件使用该模型。 |
| `setRootIndex(...)` | 树的根显示为 result 目录，而不是整个磁盘。 |
| `timer = new QTimer(this)` | 采帧定时器；`this` 为 parent，窗口销毁时 Qt 自动删。 |
| `timer2 = new QTimer(this)` | 监控定时器。 |
| `process2 = new QProcess` | 将来跑 `./LSTR` 的进程封装（先只 start bash）。 |
| `process3 = new QProcess` | 将来跑 `ffmpeg`。 |
| `process2->start("bash")` | 启动一个交互 shell，stdin 可 write 命令。 |
| `process3->start("bash")` | 同上，专给抽帧。 |
| `waitForStarted()` | **阻塞**直到 bash 起来，避免过早 write。 |
| `timer2->start(1000)` | 每 1000ms 发 timeout → 将来连到 `timerTimeOut`。**注意 timer（采帧）这里还没 start。** |
| `connect(timer → readFrame)` | 以后 timer 一超时就采帧。 |
| `connect(Open → on_Open)` | 开摄像头按钮。 |
| `connect(Stop → on_Stop)` | 关摄像头。 |
| `connect(result → on_Select)` | 选视频（控件名 result 易混，实际是选视频）。 |
| `connect(yolop_process → yolop_process)` | 识别；名字遗留，实际 LSTR。 |
| `connect(process2 输出 → 日志槽)` | LSTR 的 cout 进界面。 |
| `connect(timer2 → timerTimeOut)` | 监控刷新。 |
| `InitChart()` | 创建 CPU/内存曲线图（见后）。 |
| `setWindowTitle(...)` | 标题栏文字。 |

### 构造结束后系统状态

```text
✓ UI 已有
✓ 两个 bash 已运行（空闲等命令）
✓ timer2 已在跑（监控）
✓ timer 未跑（等开摄像头）
✓ 所有槽已绑定，但业务槽还在「待命」
```

---

## 1.3 on_Open_triggered 逐行

```cpp
void MainWindow::on_Open_triggered()
{
    cap.open(0);
    timer->start(3);
    t = getTickCount();
    count = 0;
}
```

| 行 | 代码 | 说明 |
|----|------|------|
| 1 | `cap.open(0)` | OpenCV 打开索引 0 摄像头。成功后 `cap.isOpened()==true`。失败则后续 read 得到空图。 |
| 2 | `timer->start(3)` | 每 **3 毫秒** 进入事件队列一个 timeout（实际间隔 ≥3ms，且受系统调度影响）。与 `connect(timer, readFrame)` 联动。 |
| 3 | `t = getTickCount()` | 记录 CPU  tick，关摄像头时算运行秒数。 |
| 4 | `count = 0` | 保存帧文件名从 0 起：`0.jpg,1.jpg,...`。 |

**不在这里读图**——读图全在 `readFrame`。

---

## 1.4 readFrame 逐行（高频热点）

```cpp
void MainWindow::readFrame()
{
    cap.read(src_image);
    if(!src_image.empty())
    {
        QImage qsrc = MatImageToQt(src_image);
        ui->cameraView->setPixmap(QPixmap::fromImage(qsrc));
        Mat re;
        cv::resize(src_image, re, cv::Size(320,240), cv::INTER_AREA);
        imwrite("/home/kylin/桌面/project_v1.0/frames/"+ to_string(count) + ".jpg", re);
        count ++;
    }
}
```

| 行 | 代码 | 说明 | 数据 |
|----|------|------|------|
| 1 | `cap.read(src_image)` | 从摄像头抓一帧写入成员 `src_image`。 | → BGR Mat，设备分辨率 |
| 2 | `if (!empty)` | 读失败（设备断、未 open）则整段跳过，避免崩。 | |
| 3 | `MatImageToQt(src_image)` | BGR Mat 转 QImage（见 1.9 逐行）。 | → QImage RGB |
| 4 | `setPixmap(...)` | 预览控件显示；**不参与算法**。 | 仅 UI |
| 5 | `Mat re;` | 准备缩小后的缓冲。 | |
| 6 | `resize(..., 320,240, INTER_AREA)` | 缩到 320×240；AREA 适合缩小。 | → 320×240 BGR u8 |
| 7 | `imwrite(.../frames/+count+.jpg)` | 落盘。路径写死。 | 磁盘文件 |
| 8 | `count++` | 下一文件名。 | |

**调用栈**：`timer timeout 信号 → Qt 元对象调用 readFrame`。

**注意**：LSTR 批处理默认读的是 `videos/frames/` 且从 1 起；摄像头写的是另一目录且从 0 起——两条输入链不要混。

---

## 1.5 on_Stop_triggered 逐行

```cpp
void MainWindow::on_Stop_triggered()
{
    timer->stop();
    cap.release();
    ui->cameraView->clear();
    t = ((double)getTickCount() - t) / getTickFrequency() - 1.500;
    ui->info_box->append(tr("摄像头运行了 %1 s, 采集了 %2 张图像").arg(t).arg(count));
}
```

| 行 | 说明 |
|----|------|
| `timer->stop()` | 停止再触发 readFrame。 |
| `cap.release()` | 释放设备节点。 |
| `clear()` | 预览变空。 |
| 时长公式 | `(现在tick - 开始tick)/频率 - 1.5`：作者认为启动有 1.5s 延迟要扣。 |
| `append` | 信息框追加一行中文统计。`tr` 为翻译宏。 |

---

## 1.6 on_Select_triggered 逐行

```cpp
void MainWindow::on_Select_triggered()
{
    if (cap.isOpened())
    {
        QMessageBox::warning(this, "Warning!", "请关闭摄像头再操作!");
        return;
    }
    vid_dir = "/home/kylin/桌面/project_v1.0/videos/";
    QString filename2 = QFileDialog::getOpenFileName(this, tr("文件夹"), vid_dir,
        tr("video files(*.avi *.mp4 *.wmv);;images(...);;All files(*.*)"));
    if(filename2.isEmpty())
        QMessageBox::warning(this, "Warning!", "文件夹路径错误!");
    else
    {
        process3->write("cd /home/kylin/桌面/project_v1.0/LSTR/videos/\n");
        process3->write("ffmpeg -i test.mp4 -vf fps=10 frames/%d.jpg\n");
        waitKey(2000);
        player=new QMediaPlayer;
        videowidget = ui->videowidget;
        videowidget->show();
        player->setVideoOutput(videowidget);
        player->setMedia(QUrl::fromLocalFile(filename2));
        player->play();
        if(player->state() == QMediaPlayer::StoppedState)
        {
           videowidget->close();
           return;
        }
    }
}
```

| 行/块 | 说明 |
|-------|------|
| `cap.isOpened` 检查 | 摄像头与视频互斥，开着则警告并 **return**，后面不执行。 |
| `vid_dir = ...` | 对话框默认打开目录（写死）。 |
| `getOpenFileName` | 阻塞式对话框；用户取消则 `filename2` 空。过滤器限制视频/图片类型。 |
| `isEmpty` 警告 | 用户取消或路径无效。 |
| `process3->write(cd...)` | 往 **ffmpeg 专用 bash** 发：进入 LSTR/videos。`\n` 表示回车执行。 |
| `process3->write(ffmpeg...)` | `-i test.mp4` 输入写死；`-vf fps=10` 每秒 10 帧；`frames/%d.jpg` 输出 1.jpg,2.jpg… |
| `waitKey(2000)` | OpenCV 等约 2 秒；给 ffmpeg 时间。**粗糙**，且在 UI 逻辑里调用。 |
| `new QMediaPlayer` | 播放器对象。 |
| `videowidget = ui->...` | 使用界面上的视频控件。 |
| `setVideoOutput` | 解码画面画到该控件。 |
| `setMedia(filename2)` | **播放用户选的文件**（可能与 ffmpeg 的 test.mp4 不同！）。 |
| `play()` | 开始播。 |
| `StoppedState` 判断 | 若立刻停止则关闭控件（边缘情况处理）。 |

**数据产物**：`LSTR/videos/frames/1.jpg,2.jpg,...` → 这才是后续 `./LSTR` 的输入。

---

## 1.7 yolop_process 逐行（整机最关键 UI 函数）

```cpp
void MainWindow::yolop_process()
{
    process2->write("cd /home/kylin/桌面/project_v1.0/LSTR/build\n");
    process2->write("./LSTR ../videos/frames/\n");

    waitKey(10000);
    for(int i = 1; i < INT_MAX; i++)
    {
        Mat r = imread("/home/kylin/桌面/project_v1.0/LSTR/result/" + to_string(i) + ".jpg");
        if(r.empty()) break;
        QImage rq = MatImageToQt(r);
        ui->resultView->setPixmap(QPixmap::fromImage(rq));
        waitKey(100);
    }
}
```

| 行 | 说明 | 运行时效果 |
|----|------|------------|
| `write(cd build)` | 算法工作目录切到 build，保证 `../lstr_....onnx` 相对路径正确。 | bash 执行 cd |
| `write(./LSTR ../videos/frames/)` | 启动算法；`argv[1]`=帧目录。 | **新子进程 LSTR 开始跑**（在 bash 里） |
| `waitKey(10000)` | 当前调用栈卡住 ~10s。希望此时 LSTR 多写出 result。 | UI 卡顿；不保证跑完 |
| `for i=1..` | 与 LSTR 写盘编号一致从 1。 | |
| `imread(result/i.jpg)` | 读算法输出。 | 文件→Mat |
| `empty break` | 读不到认为后面没有了（若中间缺号会提前停）。 | |
| `MatImageToQt` | 转 Qt 图。 | |
| `resultView setPixmap` | 结果显示区更新一帧。 | 用户看见车道图 |
| `waitKey(100)` | 间隔 100ms 当幻灯片。 | |

### 与进程 B 的时序关系（重要）

```text
时间轴 →

Qt:  write命令  ----waitKey(10s)----  读result1 读result2 ...
              \                      /
               \                    /
LSTR:           构造→处理1→写1→处理2→写2→...
```

二者**并行**（LSTR 在另一进程）；Qt 用等待+轮询文件的方式同步，不是 `waitForFinished`。

---

## 1.8 readBashStandardOutputInfo 逐行

```cpp
void MainWindow::readBashStandardOutputInfo()
{
    QByteArray _out = process2->readAllStandardOutput();
    if(!_out.isEmpty())
        ui->textBrowser->append("<font color=\"#FFFFFF\">" +
            QString::fromLocal8Bit(_out) + "</font> ");
}
```

| 行 | 说明 |
|----|------|
| 触发 | `process2` 有 stdout 可读时 Qt 发 `readyReadStandardOutput`。 |
| `readAllStandardOutput` | 一次读完当前缓冲。 |
| `isEmpty` | 无数据不刷 UI。 |
| `fromLocal8Bit` | 按系统本地编码（GBK/UTF-8 等）转 QString；中文 cout 依赖此。 |
| `append` HTML 白字 | 追加到日志框。内容如「正在处理第3张图片」。 |

---

## 1.9 MatImageToQt 逐行

```cpp
QImage MainWindow::MatImageToQt(const Mat &src)
{
    if(src.type() == CV_8UC1)
    {
        QImage qImage(src.cols,src.rows,QImage::Format_Indexed8);
        qImage.setColorCount(256);
        for(int i = 0; i < 256; i ++)
            qImage.setColor(i,qRgb(i,i,i));
        uchar *pSrc = src.data;
        for(int row = 0; row < src.rows; row ++)
        {
            uchar *pDest = qImage.scanLine(row);
            memcmp(pDest,pSrc,src.cols);  // 问题：应 memcpy
            pSrc += src.step;
        }
        return qImage;
    }
    else if(src.type() == CV_8UC3)
    {
        const uchar *pSrc = (const uchar*)src.data;
        QImage qImage(pSrc,src.cols,src.rows,src.step,QImage::Format_RGB888);
        return qImage.rgbSwapped();
    }
    else if(src.type() == CV_8UC4)
    {
        const uchar *pSrc = (const uchar*)src.data;
        QImage qImage(pSrc, src.cols, src.rows, src.step, QImage::Format_ARGB32);
        return qImage.copy();
    }
    else
        return QImage();
}
```

### CV_8UC3 分支（摄像头/结果最常用）逐行

| 行 | 说明 |
|----|------|
| `pSrc = src.data` | 指向 BGR 数据首字节。 |
| `QImage(..., RGB888)` | 告诉 Qt「按 RGB 解释」；但内存实际是 BGR。 |
| `src.step` | 每行字节数=cols*3+对齐 padding。 |
| `rgbSwapped()` | 交换 R/B 通道，颜色正确。返回新 QImage。 |

### CV_8UC1 分支

| 行 | 说明 |
|----|------|
| `Format_Indexed8` | 8 位索引色。 |
| `setColorCount(256)` + 灰调色板 | 索引 i → RGB(i,i,i)。 |
| 逐行 `scanLine` | 目标行指针。 |
| `memcmp` | **只比较不拷贝**，疑为 `memcpy` 笔误。 |
| `pSrc += src.step` | 跳到 Mat 下一行。 |

### CV_8UC4

带 alpha；`copy()` 保证 QImage 拥有独立缓冲，避免 Mat 释放后悬空。

---

## 1.10 监控相关逐行

### timerTimeOut

```cpp
void MainWindow::timerTimeOut()
{
    double cpuLoadAverage = sysinfo.cpuLoadAverage();
    double mem_used = sysinfo.get_mem_usage__();
    receivedData_cpu(cpuLoadAverage);
    receivedDate_mem(mem_used);
}
```

| 行 | 说明 |
|----|------|
| 每秒由 timer2 调用 | |
| `cpuLoadAverage()` | 见下，读 /proc/stat |
| `get_mem_usage__()` | 读 free -m |
| `receivedData_*` | 把数值点画进曲线 |

### cpuLoadAverage 逐行

```cpp
double sysinfolinuximpl::cpuLoadAverage()
{
    QProcess process;
    process.start("cat /proc/stat");
    process.waitForFinished();
    QString str = process.readLine();
    str.replace("\n","");
    str.replace(QRegExp("( ){1,}")," ");
    auto lst = str.split(" ");
    if(lst.size() > 3)
    {
        double use = lst[1].toDouble() + lst[2].toDouble() + lst[3].toDouble();
        double total = 0;
        for(int i = 1;i < lst.size();++i)
            total += lst[i].toDouble();
        if(total - pre_total > 0)
        {
            cpu_rate =(use - pre_user) / (total - pre_total) * 100.0;
            pre_total = total;
            pre_user = use;
        }
    }
    return cpu_rate;
}
```

| 行 | 说明 |
|----|------|
| 局部 `QProcess` | 每次采样临时进程执行 cat。 |
| `start("cat /proc/stat")` | 读内核累计 CPU 时间。 |
| `waitForFinished` | 等命令结束。 |
| `readLine` | 第一行形如 `cpu  user nice system idle ...` |
| 去换行、压缩空格、split | 得到字段列表；`lst[0]=="cpu"` |
| `use=lst[1]+[2]+[3]` | user+nice+system = 忙时间累计 |
| `total=sum(lst[1..])` | 所有状态时间总和 |
| 差分公式 | `(Δuse/Δtotal)*100` = 占用率% |
| 写回 `pre_*` | 供下秒差分 |
| `return cpu_rate` | 第一次可能仍是 0（还无上一次） |

### get_mem_usage__ 逐行

```cpp
process.start("free -m");
waitForFinished();
process.readLine();           // 跳过标题
str = process.readLine();     // Mem: total used free ... available
...
free = lst[6]; total = lst[1];
mem_rate = (total-free)/total*100;
```

| 行 | 说明 |
|----|------|
| `free -m` | 以 MB 显示内存 |
| 跳过第一行 | 表头 |
| 第二行 Mem | 字段随 util-linux 版本略有差异 |
| `lst[1]` total，`lst[6]` 作 available | 占用 = 1 - available/total |

### receivedData_cpu 逐行

```cpp
data_cpu.append(value);
while (data_cpu.size() > maxSize) data_cpu.removeFirst(); // 最多51点
series_cpu->clear();
int xSpace = maxX / (maxSize - 1);
for (int i = 0; i < data_cpu.size(); ++i)
    series_cpu->append(xSpace * i, data_cpu.at(i));
```

滑动窗口 + 全量重绘曲线点；X 均匀铺在 0…5000，Y 为占用率。

---

# 第二部分：集成 LSTR main —— 批处理逐行

`[源文件]` `上位机程序/Lane_Detection/LSTR/main.cpp` 底部 main

## 2.1 完整代码（行号）

```cpp
209 int main(int argc, char** argv)
210 {
211     if (argc != 2)
212     {
213         fprintf(stderr, "Usage: %s [imagepath]\n", argv[0]);
214         return -1;
215     }
216     LSTR mynet;
217     Mat frame;
218     LIME::lime *l;
219     const char* filefolderpath = argv[1];
220     double time = cv::getTickCount();
221     cout << "开始计时" << endl;
222     for(int i = 1; i < INT_MAX; i++)
223     {
224         cv::Mat m = cv::imread(filefolderpath + to_string(i) + ".jpg", 1);
225         if (m.empty())
226         {
227             break;
228         }
229         cout << "正在处理第" << i <<"张图片" << endl;
230         Mat d;
231         cv::resize(m, d, cv::Size(360,204));
232         l = new LIME::lime(d);
233         d = l->enhance(d);
234         Mat dstimg = mynet.detect(d);
235         cv::imwrite("../result/" + to_string(i) + ".jpg", dstimg);
236         delete l;
237     }
238     time = ((double)cv::getTickCount() - time) / cv::getTickFrequency();
239     cout << "处理完成,共用时" << time << "秒" << endl;
240     return 0;
241 }
```

## 2.2 逐行解释

| 行 | 代码 | 说明 |
|----|------|------|
| 209 | `main(argc,argv)` | 由 Qt 侧 `./LSTR ../videos/frames/` 启动。 |
| 211-215 | `argc!=2` | 必须带且只带文件夹路径一个参数；否则打印 Usage 退出。 |
| 216 | `LSTR mynet` | **构造函数同步执行**：加载 onnx、节点名、log_space（见第四部分构造逐行）。只做一次。 |
| 217 | `Mat frame` | 声明了但本 main **未使用**（遗留变量）。 |
| 218 | `LIME::lime *l` | 指针，循环内每次 new/delete。 |
| 219 | `filefolderpath=argv[1]` | 如 `../videos/frames/`。后面直接字符串拼接，**依赖末尾是否有/**。 |
| 220 | `getTickCount` | 批处理计时起点。 |
| 221 | `cout 开始计时` | stdout → 被 Qt process2 捕获显示。 |
| 222 | `for i=1..` | 与 ffmpeg `%d` 从 1 编号对齐。 |
| 224 | `imread(path+i+".jpg",1)` | flag=1 彩色图。拼出 `.../1.jpg`。 |
| 225-228 | `empty break` | 文件不存在或读失败 → 结束循环（正常退出条件）。 |
| 229 | `cout 正在处理第i张` | 进度日志。 |
| 230 | `Mat d` | 缩小/增强用缓冲。 |
| 231 | `resize(m,d,Size(360,204))` | **宽360 高204**。降低 LIME 复杂度。 |
| 232 | `new LIME::lime(d)` | 构造只记 channels；大初始化在 enhance 内。 |
| 233 | `d=l->enhance(d)` | **整棵 LIME 树**（第三部分）。输出增强 u8 图，仍约 204×360。 |
| 234 | `dstimg=mynet.detect(d)` | **整棵 detect 树**（第四部分）。 |
| 235 | `imwrite("../result/"+i+".jpg")` | 相对 **build 目录** 的 `../result/`。 |
| 236 | `delete l` | 释放该帧 LIME 对象，避免循环泄漏。 |
| 238-239 | 总耗时秒 | 打印「处理完成」。 |
| 240 | `return 0` | 进程 B 结束；bash 回到提示符。 |

### 单次循环调用展开

```text
i 固定某一帧时：

imread
  └─ OpenCV 解码 jpeg → Mat m

resize
  └─ 双线性/默认插值到 360×204

new lime
  └─ lime::lime::lime  // channel=3

enhance   ══════════════════╗
  _init_IllumMap            ║ 第三部分
  optIllumMap 循环          ║
  通道/T merge              ║
════════════════════════════╝

detect    ══════════════════╗
  normalize_                ║ 第四部分
  Session::Run              ║
  曲线与画图                ║
════════════════════════════╝

imwrite → 磁盘
delete lime
```

---

# 第三部分：LIME —— 关键函数逐行

以下以 `Lime/lime.cpp` 原版为主（逻辑最清晰）。加速版仅在热点换实现，调用关系相同。

## 3.1 enhance 逐行（总入口）

```cpp
cv::Mat lime::enhance(cv::Mat &src){
    _init_IllumMap(src);                                      // L1
    cv::Size sz(img_norm.size());                             // L2
    R = cv::Mat(sz, CV_32F, cv::Scalar::all(0.0));            // L3
    std::vector<cv::Mat> img_norm_rgb;                        // L4
    cv::Mat img_norm_b, img_norm_g, img_norm_r;               // L5

    cv::split(img_norm, img_norm_rgb);                        // L6
    img_norm_g = img_norm_rgb.at(0);                          // L7
    img_norm_b = img_norm_rgb.at(1);                          // L8
    img_norm_r = img_norm_rgb.at(2);                          // L9
    cv::Mat T = optIllumMap();                                // L10

    auto g = img_norm_g / T;                                  // L11
    auto b = img_norm_b / T;                                  // L12
    auto r = img_norm_r / T;                                  // L13

    cv::Mat g1, b1, r1;                                       // L14
    threshold(g, g1, 0.0, 0.0, 3);                            // L15
    threshold(b, b1, 0.0, 0.0, 3);                            // L16
    threshold(r, r1, 0.0, 0.0, 3);                            // L17

    img_norm_rgb.clear();                                     // L18
    img_norm_rgb.push_back(g1);                               // L19
    img_norm_rgb.push_back(b1);                               // L20
    img_norm_rgb.push_back(r1);                               // L21

    cv::merge(img_norm_rgb, out_lime);                        // L22
    out_lime.convertTo(out_lime, CV_8U, 255);                 // L23
    return out_lime;                                          // L24
}
```

| 标记 | 说明 | 数据变化 |
|------|------|----------|
| L1 | 归一化、算 T_hat、差分算子、epsilon 等，见 3.2 | src→img_norm, T_hat |
| L2 | 取归一化图尺寸 | Size(h,w) |
| L3 | 成员 R 分配全 0（本函数后续未深用，占位/遗留） | |
| L4-L5 | 准备通道容器与三个 Mat 头 | |
| L6 | 把多通道 Mat 拆成 vector\<Mat\> | 1 张→3 张单通道 |
| L7-L9 | 命名绑定；OpenCV split 顺序为 B,G,R，这里变量名与 at(0/1/2) 对应关系以 split 为准 | |
| L10 | **核心迭代**求优化光照 T，见 3.5 | → T (H×W float) |
| L11-L13 | **增强公式** 反射≈观察/光照；暗处 T 小，商更大 | float 增强通道 |
| L14 | 阈值输出缓冲 | |
| L15-L17 | `THRESH_TOZERO` 类行为（type=3）：处理 ≤0 等，抑制非法值 | |
| L18-L21 | 按 B,G,R 顺序装回 vector | |
| L22 | 三通道合成彩色 | float BGR |
| L23 | ×255 并转为 uint8 | 可给后续 OpenCV/显示/再推理 |
| L24 | 返回增强图 | |

**为何三通道共用 T？** 光照是空间位置属性，不是每个颜色各一张无关光照图。

---

## 3.2 _init_IllumMap 逐行

```cpp
void lime::_init_IllumMap(cv::Mat src){
    src.convertTo(img_norm, CV_32F, 1/255.0, 0);   // 1
    cv::Size sz(img_norm.size());                    // 2
    row = img_norm.rows;                             // 3
    col = img_norm.cols;                             // 4
    T_hat = lime::getMax(img_norm);                  // 5
    epsilon = Frobenius(T_hat)*0.001;                // 6
    dv = Dev(row, 1);                                // 7
    dh = Dev(col, -1);                               // 8
    float u = dv.at<float>(0,0);                     // 9  未再用于逻辑
    float u2 = dh.at<float>(0,0);                    // 10 未再用于逻辑
    veCDD = cv::Mat(1,row*col, CV_32F, cv::Scalar::all(0.0)); // 11
    veCDD.at<float>(0,0) = 4;                        // 12
    veCDD.at<float>(0,1) = -1;                       // 13
    veCDD.at<float>(0,row) = -1;                     // 14
    veCDD.at<float>(0,row*col-1) = -1;               // 15
    veCDD.at<float>(0,row*col-row) = -1;             // 16
}
```

| # | 说明 |
|---|------|
| 1 | 每个像素 `dst = src*1/255+0`，类型变 float。 |
| 2 | 尺寸对象（本函数内几乎不用，row/col 已够）。 |
| 3-4 | 成员 row/col，后面 getMax、reshape、Dev 都靠它。 |
| 5 | 初始光照 = 每像素通道最大。 |
| 6 | 用 T_hat 的 Frobenius 范数定 epsilon 尺度。 |
| 7-8 | 差分矩阵；k=±1 表示上下/左右邻居关系。 |
| 9-10 | 读了 dv/dh 的 (0,0) 元素但未参与后续（调试残留）。 |
| 11-16 | 频域分母相关的稀疏系数向量，供 solveT 里 `veCDD*u` 使用。 |

---

## 3.3 getMax 逐行（原版）

```cpp
cv::Mat lime::getMax(const cv::Mat& bgr)
{
    cv::Mat temp_mat(row, col, CV_32F, cv::Scalar::all(0.0)); // 1
    std::vector<cv::Mat> img_norm_rgb;                        // 2
    cv::Mat img_norm_b, img_norm_g, img_norm_r;               // 3
    cv::split(bgr, img_norm_rgb);                             // 4
    img_norm_g = img_norm_rgb.at(0);                          // 5
    img_norm_b = img_norm_rgb.at(1);                          // 6
    img_norm_r = img_norm_rgb.at(2);                          // 7
    for(int i = 0; i < row; i++){                             // 8
        for(int j = 0; j< col; j++){                          // 9
            temp_mat.at<float>(i,j) = MAX(MAX(
                img_norm_g.at<float>(i,j),
                img_norm_b.at<float>(i,j)),
                img_norm_r.at<float>(i,j));                   // 10
        }
    }
    return temp_mat;                                          // 11
}
```

| # | 说明 |
|---|------|
| 1 | 输出图，与图像同尺寸 float，初值 0。 |
| 2-4 | 拆通道。 |
| 5-7 | 绑定三个单通道（命名与通道序以 split 为准）。 |
| 8-9 | 遍历每个像素。 |
| 10 | `T_hat(i,j)=max(三通道)`。 |
| 11 | 返回初始光照图。 |

**加速版替换 8-10 行**：OpenMP 切四象限 + NEON 一次 4 像素 `vmaxq_f32`（见第五部分历史文档逻辑，此处不重复粘贴四份 section）。

---

## 3.4 Frobenius / Dev / derivative / weightStrategy 逐行要点

### Frobenius（原版）

```cpp
total = 0
for 每个元素: total += x*x
return sqrt(total)
```

即 √(Σx²)。

### Dev(n,k)

```cpp
I = 单位阵 * (-1)        // 对角全 -1
若 k>0: 把 (y, y+k) 置 1 // 超对角
若 k<0: 把 (y, y+k) 置 1 // 次对角
```

得到一阶差分矩阵。

### derivative(M)

```cpp
v = dv * M      // 行方向差分结构
h = M * dh      // 列方向
return vconcat(v,h)  // 高度变为约 2*row
```

### weightStrategy

```cpp
Wv = 1/(|dv*T_hat|+1)
Wh = 1/(|T_hat*dh|+1)
W = vconcat(Wv,Wh)
```

边缘（梯度大）权重小 → 保边。

---

## 3.5 optIllumMap 逐行

```cpp
cv::Mat lime::optIllumMap(){
    weightStrategy();                          // 1
    cv::Mat T(row,col, CV_32F, 0);             // 2
    cv::Mat G(row*2,col, CV_32F, 0);           // 3
    cv::Mat Z(row*2,col, CV_32F, 0);           // 4
    int t = 0;                                 // 5
    float u = 1;                               // 6
    while (true){                              // 7
        T = solveT(G,Z,u);                     // 8
        G = solveG(T,Z,u,W);                   // 9
        Z = solveZ(T,G,Z,u);                   // 10
        u = solveU(u);                         // 11
        if(t == 0){                            // 12
            float temp = Frobenius(derivative(T) - G);
            thd = ceil(2* log(temp / epsilon));
        }
        t += 1;                                // 13
        if(t >= thd) break;                    // 14
    }
    return T;                                  // 15
}
```

| # | 说明 |
|---|------|
| 1 | 先算 W。 |
| 2 | 光照图初值 0。 |
| 3-4 | G、Z 高度 2*row，匹配 derivative 输出。 |
| 5-6 | 迭代计数与惩罚初值。 |
| 7 | 直到 t 达到 thd。 |
| 8 | 更新 T（频域子问题）。 |
| 9 | 更新 G（软阈值）。 |
| 10 | 更新 Z（残差累积）。 |
| 11 | u ← u*rho，惩罚加大。 |
| 12 | **仅第一轮**估迭代次数 thd。 |
| 13-14 | 计数；满 thd 退出。 |
| 15 | 返回优化光照。 |

---

## 3.6 solveT / solveG / solveZ / solveU 逐行要点

### solveT

```text
X = G - Z/u
拆 X 的垂直/水平块 Xv,Xh
temp = dv*Xv + Xh*dh
mat_temp1 = Mat2Vec(2*T_hat + u*temp)   // 右端拉平
dft → numerator
dft(veCDD*u) → denominator; +2
商 → getReal → 再 dft → getReal → /cols
normalize 到 [0.2,1]                     // 关键安全
reshape1D 成 HxW
```

**逐概念行**：

| 步骤 | 为何 |
|------|------|
| 用 G,Z,u 组方程右端 | ADMM 子问题闭式解的分子 |
| DFT | 把卷积/循环结构变成频域点除 |
| normalize 0.2 | 避免 T 过小导致通道/T 爆炸 |
| reshape | 向量变回图 |

### solveG

```text
dT = derivative(T)
eps = alpha * W / u
X = dT + Z/u
sign 矩阵 S
S_ce = max(|X|-eps, 0)
G = S ⊙ S_ce            // soft-threshold
```

### solveZ

```text
Z ← Z + u * (derivative(T) - G)
```

### solveU

```text
return u * rho;  // rho 默认 2
```

---

# 第四部分：LSTR 类 —— 构造 / normalize / detect 逐行

## 4.1 构造函数逐行

```cpp
LSTR::LSTR()
{
    const ORTCHAR_T* model_path = "../lstr_360x640.onnx";          // 1
    sessionOptions.SetGraphOptimizationLevel(ORT_ENABLE_BASIC);    // 2
    ort_session = new Session(env, model_path, sessionOptions);    // 3
    size_t numInputNodes = ort_session->GetInputCount();           // 4
    size_t numOutputNodes = ort_session->GetOutputCount();         // 5
    AllocatorWithDefaultOptions allocator;                         // 6
    for (int i = 0; i < numInputNodes; i++) {                      // 7
        auto input_name_Ptr = ort_session->GetInputNameAllocated(i, allocator); // 8
        inputNodeNameAllocatedStrings.push_back(std::move(input_name_Ptr));     // 9
        input_names.push_back(inputNodeNameAllocatedStrings.back().get());      // 10
        auto input_type_info = ort_session->GetInputTypeInfo(i);   // 11
        auto input_tensor_info = input_type_info.GetTensorTypeAndShapeInfo(); // 12
        auto input_dims = input_tensor_info.GetShape();            // 13
        input_node_dims.push_back(input_dims);                     // 14
    }
    // 对 output 做 8-14 的对称循环…                                    // 15
    this->inpHeight = input_node_dims[0][2];                       // 16
    this->inpWidth  = input_node_dims[0][3];                       // 17
    this->mask_tensor.resize(inpHeight * inpWidth, 0.0);           // 18
    log_space = new float[len_log_space];                          // 19
    FILE* fp = fopen("../log_space.bin", "rb");                    // 20
    fread(log_space, sizeof(float), len_log_space, fp);            // 21
    fclose(fp);                                                    // 22
}
```

| # | 说明 |
|---|------|
| 1 | 模型相对 **当前工作目录**（Qt 已 cd 到 build）。 |
| 2 | 基础图优化（算子融合等）。 |
| 3 | **磁盘读入 onnx，构建可执行 Session**——最重的一步。 |
| 4-5 | 输入/输出个数（LSTR 一般为 2 和 2）。 |
| 6 | ORT 分配器，用于取节点名字符串。 |
| 7 | 遍历每个输入。 |
| 8 | 分配并返回输入名。 |
| 9 | **move 进成员容器**保活。 |
| 10 | `const char*` 列表供 Run 使用；指向 9 中字符串。 |
| 11-13 | 类型与形状，如 [1,3,360,640]。 |
| 14 | 存 dims。 |
| 15 | 输出同理，得到 pred 相关名与 dims。 |
| 16-17 | NCHW：下标 2=H, 3=W。 |
| 18 | 第二输入缓冲，元素全 0。 |
| 19-22 | 读 50 个 float 采样表；不检查 fp 是否 NULL（隐患）。 |

---

## 4.2 normalize_ 逐行

```cpp
void LSTR::normalize_(Mat img)
{
    int row = img.rows;                                              // 1
    int col = img.cols;                                              // 2
    this->input_image_.resize(row * col * img.channels());           // 3
    for (int c = 0; c < 3; c++)                                      // 4
      for (int i = 0; i < row; i++)                                  // 5
        for (int j = 0; j < col; j++)                                // 6
        {
          float pix = img.ptr<uchar>(i)[j * 3 + c];                  // 7
          this->input_image_[c * row * col + i * col + j] =          // 8
              (pix / 255.0 - mean[c]) / std[c];                      // 9
        }
}
```

| # | 说明 |
|---|------|
| 1-2 | 当前是 **已 resize 到网络输入** 的图高宽。 |
| 3 | 缓冲长度 = H*W*3。 |
| 4 | c=0,1,2 → B,G,R（OpenCV 顺序）。 |
| 5-6 | 行、列。 |
| 7 | 第 i 行指针 + 像素 j 的第 c 字节。 |
| 8 | **CHW 下标**：先 c 平面，再 i 行，再 j 列。 |
| 9 | 先 /255 到 [0,1]，再减均值除方差（ImageNet）。 |

**若 CHW 写反成 HWC**：网络仍跑但不准，属静默逻辑错误。

---

## 4.3 detect 逐行（分段）

### 段 A：预处理

```cpp
const int img_height = srcimg.rows;   // A1 保存入口图高（增强图）
const int img_width  = srcimg.cols;   // A2 宽
Mat dstimg;
resize(srcimg, dstimg, Size(inpWidth, inpHeight), INTER_LINEAR); // A3
normalize_(dstimg);                   // A4
```

| | 说明 |
|--|------|
| A1-A2 | 曲线坐标最后乘这两个，画回 **enhance 后的图** 而不是网络输入图。 |
| A3 | 拉到 onnx 输入大小；`Size(宽,高)`。 |
| A4 | 填 `input_image_`。 |

### 段 B：Tensor 与 Run

```cpp
array<int64_t,4> input_shape_{1,3,inpHeight,inpWidth};  // B1
array<int64_t,4> mask_shape_{1,1,inpHeight,inpWidth};   // B2
auto allocator_info = MemoryInfo::CreateCpu(...);         // B3
vector<Value> ort_inputs;
ort_inputs.push_back(CreateTensor<>(... input_image_ ...)); // B4
ort_inputs.push_back(CreateTensor<>(... mask_tensor ...));  // B5
vector<Value> ort_outputs = ort_session->Run(               // B6
    RunOptions{nullptr},
    input_names.data(), ort_inputs.data(), 2,
    output_names.data(), output_names.size());
```

| | 说明 |
|--|------|
| B1 | NCHW 图像 shape。 |
| B2 | NCHW mask，C=1。 |
| B3 | CPU 内存类型信息。 |
| B4 | 包装图像指针为 ORT Tensor（零拷贝视图语义，取决于实现，数据来自 vector）。 |
| B5 | 包装全 0 mask。 |
| B6 | **前向推理**；2 个输入；取出全部输出。 |

```cpp
const float* pred_logits = ort_outputs[0].GetTensorMutableData<float>(); // B7
const float* pred_curves = ort_outputs[1].GetTensorMutableData<float>(); // B8
const int logits_h = output_node_dims[0][1];  // B9 候选数
const int logits_w = output_node_dims[0][2];  // B10 类别数
const int curves_w = output_node_dims[1][2];  // B11 参数维
```

### 段 C：解码有效车道

```cpp
for (int i = 0; i < logits_h; i++) {           // C1 每个候选
  float max_logits = -10000; int max_id = -1;
  for (int j = 0; j < logits_w; j++) {         // C2 每个类别
    float data = pred_logits[i*logits_w + j];// C3 行优先
    if (data > max_logits) { max_logits=data; max_id=j; } // C4 argmax
  }
  if (max_id == 1) {                           // C5 有效类
    good_detections.push_back(i);
    const float *p = pred_curves + i*curves_w; // C6 第 i 组参数
    vector<Point> lane_points(50);
    for (int k = 0; k < 50; k++) {             // C7
      float y = p[0] + log_space[k]*(p[1]-p[0]); // C8
      float x = p[2]/powf(y-p[3],2)+p[4]/(y-p[3])+p[5]+p[6]*y-p[7]; // C9
      lane_points[k] = Point(int(x*img_width), int(y*img_height)); // C10
    }
    lanes.push_back(lane_points);
  }
}
```

| | 说明 |
|--|------|
| C1 | 遍历所有 query/候选。 |
| C2-C4 | 对该候选的分类向量做 argmax。 |
| C5 | **类别 id==1 才当车道**（模型约定）。 |
| C6 | curves 里第 i 行参数指针。 |
| C7 | 固定 50 个采样点。 |
| C8 | y 在 p0与p1 间按 log_space 插值。 |
| C9 | 参数化 x(y) 曲线。 |
| C10 | 归一化坐标→像素；用的是 **A1/A2 入口尺寸**。 |

### 段 D：可视化

```cpp
// D1 右=query0 左=query5 收集在 good_detections 中的下标
// D2 clone srcimg
// D3 若左右数量相等：右点 reverse + 左点 → 多边形
// D4 fillConvexPoly 绿色
// D5 addWeighted 0.4/0.6 融合
// D6 所有 lanes 画 circle
// D7 return visualization_img
```

**绿填充是后处理，不是网络输出通道。**

---

# 第五部分：加速版热点逐行（摘要精读）

## 5.1 NEON getMax 内层四行

```cpp
float32x4_t g = vld1q_f32(g_ptr + j);     // 从内存 load 4 float → 寄存器
float32x4_t b = vld1q_f32(b_ptr + j);
float32x4_t r = vld1q_f32(r_ptr + j);
float32x4_t m = vmaxq_f32(g, vmaxq_f32(b,r)); // lane0..3 各自 max
vst1q_f32(out_ptr + j, m);                // 写回 4 个 max
```

OpenMP 四个 section 改的是 **i、j 的起止范围**（四象限），内层同上。

## 5.2 Frobenius 问题行

```cpp
total_sum = vaddq_f32(total_sum, squared); // 多线程同时写 total_sum → 竞争
// 并行区结束后的 critical 无法撤销已发生的竞争
```

---

# 第六部分：Unet 逐行精读

`[源文件]` `Unet_NCNN/src/unet.cpp`

## 6.1 加载与读图

```cpp
if (argc < 2) exit;                    // 必须给图片路径
ncnn::Net Unet;
Unet.load_param("../models/model.ncnn.param"); // 结构
Unet.load_model("../models/model.ncnn.bin");   // 权重
src = imread(argv[1]);
```

## 6.2 pad 逐行逻辑

```cpp
if (width > height) {
  top/bottom = 补成正方形的上下黑边
  copyMakeBorder(src,tmp, top,bottom,0,0, BLACK)
} else {
  left/right 左右补边
}
// 再把 top.. 按比例映到 720 坐标系，供后处理清边
```

## 6.3 归一化与 HWC→CHW 逐行

```cpp
resize 720
convertTo float /255
for i in 0..H-1:
  for j in 0..W-1:
    for k in 0..2:
      // k=通道, i=行, j=列
      data[k*H*W + i*W + j] = srcdata[i*W*3 + j*3 + k]
in.reshape(720,720,3)
```

| 下标 | 布局 |
|------|------|
| 右端 srcdata | HWC 交错 |
| 左端 data | CHW 平面 |

## 6.4 推理与 argmax 逐行

```cpp
ex = create_extractor()
ex.set_light_mode(true)
ex.set_num_threads(4)
ex.input("in0", in)       // 名字必须与 param 一致
ex.extract("out0", mask)

for i,j:
  maxk = 0
  best = mask(c=0,i,j)
  for k in channels:
    if mask(k,i,j) > best: best=...; maxk=k
  cv_img[i,j] = maxk
  if 落在 pad 带: cv_img[i,j]=0

cv_img*=255
result = image; result.setTo(绿, cv_img)
imwrite result.jpg
```

---

# 第七部分：把「运行过程」再串一次（带时间顺序）

## 7.1 冷启动（只发生一次）

```text
1. 用户启动 Lane_Detection
2. main: QApplication, MainWindow 构造
3. 构造内: setupUi, 两个 bash start, connect, timer2 start, InitChart
4. a.exec() 等待
```

## 7.2 选视频识别（主演示路径）

```text
5. 点击选视频 → on_Select_triggered
6. process3 ffmpeg 写 frames/1..N.jpg
7. 点击识别 → yolop_process
8. process2: cd build; ./LSTR frames目录
9. LSTR 进程启动:
   9.1 LSTR 构造加载 onnx（数秒内可能较慢）
   9.2 i=1: imread → resize → enhance(整树) → detect(整树) → imwrite result/1.jpg
   9.3 i=2: 同样…（不再重新 load onnx）
   9.4 直到 imread 失败
10. Qt waitKey 后读 result 显示
11. 全程 timer2 每秒 CPU/内存
```

## 7.3 每一帧算法内部（浓缩）

```text
enhance:
  /255 → max通道 T_hat → 迭代 T → 通道/T → *255
detect:
  resize网络输入 → (x-mean)/std CHW → Run
  → logits 筛有效 → curves+log_space 变点 → 画线/绿区
```

---

# 第八部分：速查附录

## 8.1 函数调用速查表

| 谁调用 | 被调 | 文件 |
|--------|------|------|
| OS | `main` (Qt) | Lane_Detection/main.cpp |
| Qt main | `MainWindow::MainWindow` | mainwindow.cpp |
| Open 点击 | `on_Open_triggered` | mainwindow.cpp |
| timer | `readFrame` | mainwindow.cpp |
| result 点击 | `on_Select_triggered` | mainwindow.cpp |
| yolop 点击 | `yolop_process` | mainwindow.cpp |
| process2 输出 | `readBashStandardOutputInfo` | mainwindow.cpp |
| timer2 | `timerTimeOut` → cpu/mem | mainwindow + sysinfo |
| bash | `LSTR main` | LSTR/main.cpp |
| LSTR main | `LSTR::LSTR` | LSTR/main.cpp |
| LSTR main | `lime::enhance` | lime |
| enhance | `_init_IllumMap, optIllumMap, ...` | lime |
| LSTR main | `LSTR::detect` | LSTR/main.cpp |
| detect | `normalize_, Session::Run` | LSTR/main.cpp |

## 8.2 已知坑（读运行过程时避免误判）

1. 路径写死 `/home/kylin/...`  
2. ffmpeg 输入 `test.mp4` ≠ 对话框文件  
3. yolop 名实际 LSTR  
4. waitKey 阻塞 UI  
5. Frobenius OpenMP 竞争  
6. getMax 尾部 `j+=4`  
7. 绿区非模型 mask  
8. 灰度 MatImageToQt 用了 memcmp  
9. 摄像头帧号从 0、目录与视频帧不一致  

---

## 结束：建议你这样「深入跑一遍」

1. 只看文首 **图 0-A ~ 0-G**，能默画再往下。  
2. 对照源码打开 `mainwindow.cpp`，用 **1.7 yolop_process 逐行** 对一下。  
3. 打开 `LSTR/main.cpp`，用 **第二部分 + 图 0-B** 对批处理。  
4. 跟一帧：`enhance` 逐行 → `detect` 逐行。  
5. 最后看 Unet，对比「像素 mask vs 曲线参数」两种部署。

若你指定**某一个函数**（例如只要 `solveT` 或 `Session::Run` 前后），可以再在该函数上补「假数据手算一遍」的数值例子。
