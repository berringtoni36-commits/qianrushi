**基于FT2000/4嵌入书视觉感知系统解析**

1. **简历描述与面试介绍**
    1. **简历介绍**

![Linux视觉感知处理原作者文档](projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档.png)

文字模板：

**基于 FT2000/4 处理器的嵌入式视觉感知系统** **C++/ARM Linux/Neon/OpenMP**

**项目描述：**基于**飞腾 FT2000/4 处理器与国产麒麟操作系统**，实现从**摄像头输入、图像预处理、模型推理再到可视化监测**的全流程落地，完成面向校园无人配送车的实时车道线识别系统。

**技术要点：**

1. **预处理实现：**复现论文《LIME》中的低照度增强算法，解决**夜晚场景下车道线辨识度低**的问题，作为系统的预处理算法；
2. **预处理优化：**通过**循环重排、循环展开、Arm Neon 指令集优化及OpenMP多线程并行加速**等策略提升预处理效率；
3. **模型轻量化：**对比**Unet与Transformer-based LSTR**两种车道线识别网络的性能差异，采用**卷积核结构优化+量化**实现模型轻量化，基于**NCNN推理框架**完成端侧部署，提升边缘设备推理速度；
4. **性能检测可视化：**使用QT开发上位机完成可视化界面，并编写程序性能检测模块，实时**监测CPU占用率、内存使用率**等关键指标可视化。
    1. **面试介绍**

硬件（FT2000是处理器，4是四核）：飞腾教育开发板，基于linux系统上开发了一套实时低照度增强与车道线检测系统，主要分为三个部分。

**低照度增强预处理算法的开发和优化、车道线识别神经网络的训练和部署、上位机与性能检测**

**第一低照度增强预处理算法的开发和优化：**对一篇学术论文《LIME》进行了代码实现，作为车道线识别之前的低照度增强预处理算法。然后由于开发板没有GPU加速，只能用CPU进行图像处理，并且对实时性要求比较高。所以对我复现的算法进行了程序性能优化：数据存储策略优化如循环重排（行优先遍历，外用列，确保数据存储顺序与遍历顺序一致，避免不必要的内存跳跃）提升缓存命中率和利用率，编译器指令集优化如 Neon 指令集（同时处理四个32位的浮点数）实现并行计算、循环展开（利用neon，减少循环控制的开销，同时提高指令级并行性），OpenMP多线程接口(多核处理块)等优化策略，显著提高预处理速度。

**第二车道线识别神经网络的训练和部署：**模型部署方面，对比两种模型，分别是Unet和基于transformer的LSTR实现对车道线识别神经网络进行识别，采用深度可分离卷积替换传统卷积、结合参数量化技术来减少参数量；基于NCNN推理框架完成轻量化模型的端侧部署，实现模型的高效推理。

**最后一部分上位机与性能检测：**上位机展示部分：将神经网络推理后的画面显示在QT上位机中。还做了一个性能检测模块，采集CPU和内存的使用率。使用QT上的timer定时器 并利用终端上得top等工具采集系统CPU和内存 占用率显示在上位机界面中。

1. **项目背景与方案总体介绍**
    1. **项目背景**

随着科技的不断发展和智能交通系统的不断完善，自动驾驶技术成为了现代交通领域的研究热点之一。自动驾驶车辆的发展对于提高交通安全性、减少交通事故和拥堵具有重要意义。

在自动驾驶车辆中，车道线识别是一项关键技术。车道线识别能够准确地检测道路上的车道线，并提供给自动驾驶系统有关车道位置和道路几何信息的关键数据。通过对车道线的识别和跟踪，自动驾驶系统可以更好地实现车辆的定位、导航和路径规划。

然而，车道线识别面临着一些挑战。道路环境的复杂性、光照条件的变化以及道路标线的磨损等因素都可能影响车道线的准确识别。此外，算法的实时性也是实际应用中需要考虑的一个重要因素。自动驾驶当中部署的算法通常在车载的开发板上面运行，性能较一般的台式机或个人笔记本电脑有较大的差距，尤其在图形处理(gpu)方面。如果算法模型复杂度过高，计算量太大，实际运行中将难以达到实时的效果。因此，开发一种稳定、准确、鲁棒同时足够轻量化的自动驾驶车道线识别算法具有重要意义。

- 1. **项目内容**

本项目采用配备摄像头的车载系统实时采集车道行驶画面，将摄像头采集到的图片进行图像预处理，预处理算法是基于论文《LIME: Low-Light Image Enhancement via Illumination Map Estimation》中算法进行改进的方法，对采集到的实时图像进行低照度增强，再将处理后的图像传输到卷积神经网络当中进行车道线识别，最后将识别后的图像以视频帧的形式输出到上位机上。系统可以将采集画面中的车道线识别出来，为汽车自动驾驶提供参考，也可以用于对人类驾驶员进行实时安全监测，防止由于疲劳驾驶、酒后驾驶等造成的偏离应驶车道，对于交通秩序维持、车载人员生命安全防护具有广泛的应用前景。系统总体功能设计框图如所示。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%201.png>)

图 1 总体功能设计

- 1. **系统架构分析**

在项目背景与总体功能设计的基础上，项目组内进行了系统架构的设计与硬件选型，以实现系统强稳定性、对环境的高适应性与高检测效率预期。

**2.3.1 总体设计**

本系统采用基于国产飞腾FT2000/4（兼容D2000/8）处理器平台研制天乾C216F教育开发板套件作为主控单元，采用海康威视DE-E12摄像头实时采集车道线画面信息，利用板载AMD-R5-230型号显卡实时处理CPU输送的图像信息，并在QT编写的上位机中通过外接显示器分别显示原始采集画面和识别后的画面。各部分的硬件连接图如。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%202.png>)

图 2 硬件连接图

在硬件基础上，为实现总体功能，将系统分为图像采集模块、图像预处理模块、图像识别模块、上位机显示模块。各模块间的功能联系如所示。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%203.png>)

图 3 系统模块关系图

系统通过摄像头采集图像，将图像数据传输给图像预处理模块，经过LIME算法进行低照度增强，然后将图像识别模块调用图像预处理模块的输出图片，通过卷积神经网络进行车道线识别，将识别后的数据传输给图像到上位机上。

经过综合考虑兼容性，稳定性等指标，为保证各个模块能够正常工作并最大限度发挥性能，选择在银河麒麟V10系统上进行开发，图像预处理算法以及卷积神经网络车道线识别算法均采用C++编写，上位机在系统自带的QT环境中搭建。

**2.3.2 天乾 C216F 主控板**

**(1)功能分析**

在整体系统中，天乾C216F教育开发板作为主控单元对图像信息处理性能优化起到主导性作用。主控板在整套系统中起到调度软件、操控硬件的作用，主要负责执行包括图像采集、图像预处理、图像识别、图像显示在内的所有的软件程序，进行进程的调度与数据的存取；此外，还要驱动摄像头采集图像，并且借助显卡对处理后的图像在上位机上显示。

**(2)性能评估**

作为连接软硬件的桥梁，主控板运转是否稳定、接口是否完善、中心控制单元运算性能是否快速是决定项目成败的关键。天乾C216F教育开发板实物图如，其拥有集成了4个FTC663内核、主频达到2.6GHz的CPU，运算速度能够满足本项目要求。开发板拥有两个SODIMM插槽，单条最大支持16GBDDR4的大内存配置进一步提高了文件处理速度，使运行中的系统稳定性、安全性增强。此外，健全的系统接口为项目开发提供了极大的便捷。

![Linux视觉感知处理原作者文档](projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档.jpeg)

图 4 主控板实物图

**2.3.3 DS-E12 摄像头**

车道线识别一般将摄像头装载与车身前方，考虑到扩展性和便携性等因素，本系统选用一款便于安置、接口通用、分辨率匹配的图像采集设备。HIKVISION的DS-E12摄像头实物如，其质量轻、体积小，并且能够稳定的安置在移动设备上。接口采用USB2.0，能够与开发板适配，并且采集到的图像分辨率为1920*1080，满足项目中对分辨率的要求，且其支持JPEG格式图像采集，为接下来图像的预处理和车道线识别操作提供前提。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%204.png>)

图 5 摄像头实物图

- 1. **项目创新点**

1. **基于C++的LIME低照度增强算法实现**

本项目在3.1阐述了LIME低照度增强算法的原理以及相关公式，并基于论文算法步骤使用C++编写了程序。对于论文中公式一些计算过程，结合C++的语言特性和OpenCV现有的函数库根据自己的理解进行了函数重构，最终实现了和论文作者Matlab源代码一样的增强效果，并且在车道线1· 数据集当中得到了检验。

1. **基于NEON指令的LIME算法加速**

本项目在3.3.3阐述了利用NEON指令特有的向量化操作对LIME算法中的循环遍历过程进行优化，将循环遍历中四个连续地址的像素点数据存储到NEON特有的向量寄存器当中，同时对涉及到矩阵加减乘除等运算操作的地方使用NEON指令特有的运算函数进行等效处理，在不影响图片增强效果的前提下加速了代码运行速度。

1. **基于OpenMP多线程的LIME算法加速**

本项目在3.3.4中阐述了面向多核平台的OpenMP并行多线程加速接口，结合OpenMP多线程并行加速的特性，对LIME算法中图像增强函数进行色彩通道分离，每个色彩通道的读取、计算与存储都是有单独的一个CPU线程执行的，通过多核线程并行的加速方式，可以更加快速地处理色彩通道当中的复杂矩阵运算，从而加速代码执行速度；另一方面，利用OpenMP的多线程并行特性，执行图像分块操作，将图像分成四等份，每一份使用OpenMP多线程并行指令调用CPU核进行并行处理。

1. **对Unet卷积神经网络的轻量化加速**

本项目在第4.2节中阐述了对识别车道线的Unet神经网络进行的轻量化加速措施。包括使用通道分离，分组卷积缩减模型体积、使用pnnx工具将pth源模型转换使用C++部署到适用于嵌入式移动端设备的ncnn框架当中，优化后的模型体积缩小到了原pth模型的1/12，识别速度也提高到了原来的两倍多。

1. **端到端LSTR网络的C++ ONNX框架部署加速**

本项目在第4.3节中阐述了除Unet外的另一种基于端到端方法的LSTR神经网络。该网络使用一个拟合的多项式对车道线形状进行了预建构，在神经网络训练过程中引入了多项式参数，使得网络在识别过程中简化了对车道线的特征提取和融合过程，提升了识别速度。为了进一步轻量化模型，原pth模型通过pytorch转换到了onnx格式，并成功使用c++部署到了onnx runtime上面。部署之后的模型识别图像达到了0.1~0.2s每张，实时性较Unet有了进一步的提升。

1. **LIME算法核心原理及其优化**
    1. **算法理论基础（论文按名称查找）**![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%205.png>)![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%206.png>)
    2. **预处理代码实现流程**

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%207.png>)

图 6 预处理代码实现流程

**3.3 性能优化策略**

**关键函数模块：**

表 1 关键函数模块

|   |   |   |
|---|---|---|
|**函数 / 模块**|**功能描述**|**核心技术**|
|_init_IllumMap(src)|光照图初始化|归一化（CV_32F）、通道最大值提取|
|optIllumMap()|光照图优化|ALM 迭代、子问题（T/G/Z/U）求解|
|getMax(img_norm)|最大光照图计算|OpenMP 并行、NEON 指令加速|
|Frobenius()|矩阵范数计算|SIMD 并行、缓存优化|
|enhance()|图像增强|通道分离 / 合并、阈值处理|

**3.3.1 缓存优化：循环重排（Loop Reordering）**

问题：列优先遍历导致缓存行频繁失效；

优化：匹配行优先存储，内层循环遍历列：

// 优化前（低效）  

**for** (**int** j = 0; j < cols; j++)   

    **for** (**int** i = 0; i < rows; i++) sum += A[i][j];  

// 优化后（高效）  

**for** (**int** i = 0; i < rows; i++)   

    **for** (**int** j = 0; j < cols; j++) sum += A[i][j];  

**3.3.2 循环展开（Loop Unrolling）**

**核心**：减少循环控制开销，适配NEON并行特性；

**实现**：手动展开循环，每次处理4个像素，避免分支跳转；

**汇编验证**：生成的NEON指令无分支，单周期完成4个像素计算。

**3.3.3 指令集优化（ARM NEON）**

本项目中，LIME算法流程在对图像矩阵进行运算操作时，存在大量的对像素点进行遍历的操作，通常的做法都是使用双层嵌套for循环对像素点进行遍历。外层循环次数等于图像的行数，内层循环次数等于图像的列数。对于一张720*720的图像，进行一次遍历相当于执行了720*720也就是518400次操作。如此庞大的运算量对于CPU是不小的负荷，在本项目对实时性有着需求的应用场景下显然是不利的。因此，为了优化代码执行效率，本项目采用了NEON向量化操作优化代码中大量的嵌套for循环，对相关函数进行了重写。

**1. ARM NEON 简介**

NEON指令集基于SIMD（SingleInstructionMultipleData）指令架构，即单指令多数据的指令架构，如中所示，相比于SISD（SingleInstructionSingleData）指令架构，SIMD能够利用单条指令处理同数据类型和长度的N个数据进行并行处理，并且仅需单条指令的执行时间，将指令执行时间缩短了N倍。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%201.jpeg>)

图 7 SISD指令集与SIMD指令集示意图

这对于有低功耗要求或散热受限的ARM开发板来说，能够极大地优化性能。特别是在算术运算、图像处理这类应用场景中，参与运算的数据通常不满32位，并行运算深度可进一步增加，缩减运算时间。

NEON协处理器拥有独立的寄存器系统和硬件执行单元，利用16个128位寄存器q0~q15与32个64位寄存器d0~d31协助并行计算。但两套寄存器为重叠结构，其关系为qn表示d2n和d2n+1，对应关系如图 8，运用时需注意误覆盖问题。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%208.png>)

图 8 NEON寄存器示意图

**2. NEON优化方式**

NEON指令集本项目采用功能灵活、移植性好的内联函数优化方式处理编解码过程。内联函数法需引入neon官方头文件“arm_neon.h”。其中包含NEON官方指令声明，每条指令由指令码、指令模式、寄存器位数、操作数构成。按照指令功能可以分为：结构加载与存储、逻辑运算、算术运算、移位运算等。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%209.png>)

图 9 NEON指令构成

**3. NEON 核心应用场景**

表 2 NEON核心应用场景

|   |   |   |
|---|---|---|
|**操作**|**NEON 指令**|**功能**|
|数据加载|vld1q_f32|一次性加载4个32位浮点数（128位寄存器）|
|最大值计算|vmaxq_f32|并行计算4个像素的RGB通道最大值|
|数据存储|vst1q_f32|批量存储计算结果|
|矩阵运算|vmlaq_f32|并行乘加运算（傅里叶变换蝶形运算）|

其中代码优化中使用较多的加载存储指令vld和vst，作用是将图像的RGB颜色数据以线性或者结构化的方式加载到向量存储器当中，并且进行交叉存储。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2010.png>)

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2011.png>)

图 10 两种不同的加载方式

交叉存储是NEON向量处理器中的一种数据存储方式，它可以提高内存访问的效率和数据处理的并行性。NEON交叉存储方式将多个数据向量交错存储在连续的内存块中，以便利用SIMD指令同时处理多个数据。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2012.png>)

图 11 交叉存储示意图

**4.3.4 优化方式**

1. **用NEON优化求取最大值函数**

在LIME算法代码中，构建了一个计算色彩通道最大值的函数用于求解初始光照图：

    cv::Mat lime::getMax(const cv::Mat& bgr){//求RGB三个通道的最大值用于构建初始化的光照图

        cv::Mat temp_mat(row, col, CV_32F, cv::Scalar::all(0.0));

        std::vector<cv::Mat> img_norm_rgb; // 定义一个存储三通道分量的向量

        cv::Mat img_norm_b, img_norm_g, img_norm_r; // 定义三个矩阵，分别用于存储三个通道的分量

        cv::split(bgr, img_norm_rgb); // 将归一化图像分解为三个通道

        img_norm_g = img_norm_rgb.at(0); // 获取绿色通道

        img_norm_b = img_norm_rgb.at(1); // 获取蓝色通道

        img_norm_r = img_norm_rgb.at(2); // 获取红色通道

        for(int i = 0; i < row; i++){

            for(int j = 0; j< col; j++){

                temp_mat.at<float>(i,j) = MAX(MAX(img_norm_g.at<float>(i,j),img_norm_b.at<float>(i,j)), img_norm_r.at<float>(i,j));

            }

        }

        return temp_mat;

    }  

该函数的核心部分是通过一个双层for循环遍历图像的像素点，比较求出三个通道的最大值。每个像素点遍历的操作会极大的影响到代码的运行速度，基于NEON指令向量化操作的并行加速特性，本项目采取了一种加速方法，通过在循环中一次取四个元素加快遍历过程。加速原理如所示。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2013.png>)

图 12 NEON向量化加速原理图

根据图 12所示加速原理，修改原求取最大值函数如下：

cv::Mat lime::getMax(const cv::Mat& bgr)

        {

            cv::Mat temp_mat(row, col, CV_32F, cv::Scalar::all(0.0));

            std::vector<cv::Mat> img_norm_rgb;

            cv::Mat img_norm_b, img_norm_g, img_norm_r;

            cv::split(bgr, img_norm_rgb);

            img_norm_g = img_norm_rgb.at(0);

            img_norm_b = img_norm_rgb.at(1);

            img_norm_r = img_norm_rgb.at(2);

            // 使用NEON加速计算最大值

            for (int i = 0; i < row; i++)

            {

                for (int j = 0; j < col; j += 4)  // 每次处理4个元素

                {

                    float32x4_t g = vld1q_f32(img_norm_g.ptr<float>(i) + j);

                    float32x4_t b = vld1q_f32(img_norm_b.ptr<float>(i) + j);

                    float32x4_t r = vld1q_f32(img_norm_r.ptr<float>(i) + j);

                    float32x4_t max_val = vmaxq_f32(g, vmaxq_f32(b, r));

                    vst1q_f32(temp_mat.ptr<float>(i) + j, max_val);

                }

            }

            return temp_mat;

        }

其中vld1q_f32为前面介绍的NEON INTRINSICS加载函数，作用是将四个相邻的float32型的像素点变量加载到存储四个对应类型变量的向量当中。Vmaxq_f32函数比较加载的向量大小，最后由vst1q_f32函数将比较的结果存储到temp_mat当中。

1. **用NEON优化求取矩阵F范数函数**

在LIME算法迭代子问题求解的过程中，需要一个收敛条件来判断迭代是否可以停止（见式3-16）式中需要对矩阵求范数。因此，代码中构建了一个专门用于求矩阵范数的函数：

    float lime::Frobenius(cv::Mat mat){   //求一个矩阵的F范数

            int row_temp = mat.rows;

            int col_temp = mat.cols;

            float total = 0.0;

            for(int i = 0; i < row_temp ; i++){

            for(int j =0; j< col_temp ; j++){

                total = total + pow(mat.at<float>(i,j), 2);

            }

        }

        total = sqrt(total);

        return total;

    }

该函数中同样涉及到了一个双层for循环遍历，同时循环内执行操作还有乘方运算。为了加速循环过程，同样使用NEON向量化操作对代码进行优化加速：

    float lime::Frobenius(cv::Mat mat)

    {

        int row_temp = mat.rows;

        int col_temp = mat.cols;

        float32x4_t total_sum = vdupq_n_f32(0.0f);

        for (int i = 0; i < row_temp; i++)

        {

            for (int j = 0; j < col_temp; j += 4)  // 每次处理4个元素

            {

                float32x4_t values = vld1q_f32(mat.ptr<float>(i) + j);

                float32x4_t squared_values = vmulq_f32(values, values);

                total_sum = vaddq_f32(total_sum, squared_values);

            }

        }

        // 将向量中的4个部分求和

        floatx2_t temp =

vpaddq_f32(vget_low_f32(total_sum), vget_high_f32(total_sum);

        float result = vpaddq_f32(vget_low_f32(temp),vget_low_f32(temp);

        // 提取结果

        return result;

    }

其中vmulq_f32是NEON INTRINSICS中用于执行乘法运算的函数。优化代码首先使用向量化操作一次从内层循环加载四个32位浮点数到寄存器当中，然后使用乘法运算对向量寄存器中的数据进行乘方，然后使用vaddq_f32函数进行累加求得乘方和。但是，total_sum向量寄存器中包含4个部分的和。为了将这4个部分的和转化为单个值，我们需要进行向量求和操作。这里使用了vpaddq_f32函数进行部分求和。该函数将总和的低两个元素和高两个元素分别相加，得到两个部分的和。然后再次使用vpaddq_f32函数对这两个部分的和进行求和，得到总和。最终，我们从total_sum向量中提取出最终的平方和。运算过程图解如图 13所示。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2014.png>)

图 13 NEON优化求平方和过程图解

1. **用NEON优化向量压缩函数**

除了求取色彩通道最大值和求取平方和的函数外，LIME算法代码中其他的部分也有可以使用NEON优化的地方，主要集中在使用for循环遍历的地方，下面是使用NEON优化的其他函数代码。

优化前：

    cv::Mat lime::Mat2Vec(cv::Mat mat){  //将多维矩阵压缩成一维

            mat = mat.t(); //现将矩阵转置

            int row_temp = mat.rows;

            int col_temp = mat.cols;

            cv::Mat mat_one(1,row_temp * col_temp, CV_32F);

            for(int i = 0; i < row_temp ; i++){

            for(int j =0; j< col_temp ; j++){

                mat_one.at<float>(0,i*col_temp+j) = mat.at<float>(i,j);

            }

        }

        return mat_one;      

    }

优化后：

    cv::Mat lime::Mat2Vec(cv::Mat mat){  //将多维矩阵压缩成一维

            mat = mat.t(); //现将矩阵转置

            int row_temp = mat.rows;

            int col_temp = mat.cols;

            cv::Mat mat_one(1,row_temp * col_temp, CV_32F);

        int num_elements = row_temp * col_temp;

        for (int i = 0; i < num_elements; i += 4)  // 每次处理4个元素

        {

            // 加载4个源矩阵中的元素

            float32x4_t vec_src = vld1q_f32(mat.ptr<float>(0) + i);

            // 存储到目标矩阵

            vst1q_f32(mat_one.ptr<float>(0) + i, vec_src);

        }

        return mat_one;      

    }

1. **用NEON优化傅里叶变换过程**

傅里叶变换部分的代码由三层嵌套for循环构成，最内层循环部分包含了数据读取、存储以及蝶形运算等涉及到大量矩阵计算的繁琐过程，为了提高程序运行效率，结合NEON向量化并行特性，从以下方面对傅里叶变换部分代码进行了优化：

数据复制部分：使用vld1q_f32和vst1q_f32指令一次复制4个数据元素，减少内存访问次数；

生成WN表部分：使用循环和标量运算生成WN表的实部和虚部；

蝶形运算部分：使用NEON指令vmul_f32、vsub_f32和vadd_f32对复数进行乘法、减法和加法操作；

结果存储部分：使用vst1_f32指令一次存储2个数据元素。

根据上述思路，实现傅里叶变换部分NEON优化代码如下：

void lime::fft2_neon(const cv::Mat& input, cv::Mat& output, int opt)

    {

        int lim = input.cols;

        int index;

        output = cv::Mat(1, input.cols, CV_32FC2);

        // 使用 NEON 指令进行数据复制

        const float* input_ptr = input.ptr<float>(0);

        float32x4_t input_data, output_data;

        for (int i = 0; i < lim; i += 4)

        {

            index = ReverseBin(i, log2(lim));

            input_data = vld1q_f32(input_ptr + index);

            output_data = vsetq_lane_f32(0.0f, output_data, 1); // 设置虚部为0

            vst1q_f32(reinterpret_cast<float*>(output.ptr<cv::Vec2f>(0, i)), input_data);

            vst1q_f32(reinterpret_cast<float*>(output.ptr<cv::Vec2f>(0, i)) + 4, output_data);

        }

        cv::Mat WN(1, lim / 2, CV_32FC2);

        float* WN_ptr = WN.ptr<float>(0);

        // 生成 WN 表，避免重复计算

        for (int i = 0; i < lim / 2; i++)

        {

            float angle = 2 * CV_PI * i / lim;

            WN_ptr[i * 2] = std::cos(angle);

            WN_ptr[i * 2 + 1] = opt * -std::sin(angle);

        }

        int Index0, Index1;

        float32x2_t temp_real, temp_imag, wn_real, wn_imag;

        for (int steplength = 2; steplength <= lim; steplength *= 2)

        {

            for (int step = 0; step < lim / steplength; step++)

            {

                for (int i = 0; i < steplength / 2; i += 2)

                {

                    Index0 = steplength * step + i;

                    Index1 = steplength * step + i + steplength / 2;

                    // 加载数据

                    temp_real = vld1_f32(reinterpret_cast<const float*>(&output.at<cv::Vec2f>(0, Index1)[0]));

                    temp_imag = vld1_f32(reinterpret_cast<const float*>(&output.at<cv::Vec2f>(0, Index1)[1]));

                    wn_real = vld1_f32(reinterpret_cast<const float*>(&WN.at<cv::Vec2f>(0, (long)i * lim / steplength)[0]));

                    wn_imag = vld1_f32(reinterpret_cast<const float*>(&WN.at<cv::Vec2f>(0, (long)i * lim / steplength)[1]));

                    // 执行蝶形运算

                    float32x2_t temp_real_new = vmul_f32(temp_real, wn_real) - vmul_f32(temp_imag, wn_imag);

                    float32x2_t temp_imag_new = vmul_f32(temp_real, wn_imag) + vmul_f32(temp_imag, wn_real);

                    // 存储结果

                    vst1_f32(reinterpret_cast<float*>(&output.at<cv::Vec2f>(0, Index1)[0]), vsub_f32(temp_real, temp_real_new));

                    vst1_f32(reinterpret_cast<float*>(&output.at<cv::Vec2f>(0, Index1)[1]), vsub_f32(temp_imag, temp_imag_new));

                    vst1_f32(reinterpret_cast<float*>(&output.at<cv::Vec2f>(0, Index0)[0]), vadd_f32(temp_real, temp_real_new));

                    vst1_f32(reinterpret_cast<float*>(&output.at<cv::Vec2f>(0, Index0)[1]), vadd_f32(temp_imag, temp_imag_new));

                }

            }

        }

        if (opt == -1)

        {

            // 归一化结果

            float scale = 1.0f / lim;

            for (int i = 0; i < lim; i++)

            {

                output.ptr<cv::Vec2f>(0, i)[0] *= scale;

                output.ptr<cv::Vec2f>(0, i)[1] *= scale;

            }

        }

    }

**3.3.4 OpenMP并行优化算法**

在本项目中，我们采用了面向多核平台的并行优化算法，以利用天乾C216F教育开发板的四核处理器。通过利用多核平台的优势，我们可以在相同的时间内处理更多的任务量，从而提高图像处理过程的效率和运行时间。这种优化方法特别适用于本项目中的图像处理任务，因为图像处理通常涉及大量的数据和重复的操作。通过将LIME图像增强过程中的部分代码合理地并行化，我们可以更充分地利用开发板的CPU资源，提高系统的整体性能。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2015.png>)

图 14 多核串行与并行示意图

1. **OpenMP接口介绍**

OpenMP（Open Multi-Processing）是一种用于并行编程的API，旨在简化多线程编程。它提供了一组指令和编译器指示，允许程序员将代码标记为并行执行，以充分利用多核处理器和共享内存系统的并行计算能力。

OpenMP采用fork-join的执行模式。开始的时候只存在一个主线程，当需要进行并行计算的时候，派生出若干个分支线程来执行并行任务。当并行代码执行完成之后，分支线程会合，并把控制流程交给单独的主线程。一个典型的fork-join执行模型的如图 15所示。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2016.png>)

图 15 OpenMP运行原理示意图

1. **OpenMP功能指令汇总**

OpenMP编程模型以线程为基础，通过编译制导指令制导并行化，有三种编程要素可以实现并行化控制，他们分别是编译制导、API函数集和环境变量。

编译制导指令以#pragma omp 开始，后边跟具体的功能指令，格式如：#pragma omp 指令[子句[,子句] …]。列出了OpenMP并行操作中常用的一些功能指令。

表 3 OpenMP并行操作中常用的一些功能指令

|   |   |
|---|---|
|指令名称|指令含义|
|parallel|用在一个结构块之前，表示这段代码将被多个线程并行执行|
|for|用在for循环语句之前，表示for循环体的代码将被多个线程并行执行，它同时具有并行域的产生和任务分担两个功能|
|sections|用在可被并行执行的代码段之前，用于实现多个结构块语句的任务分担，可并行执行的代码段各自用section指令标出|
|single|用在并行域内，表示一段只被单个线程执行的代码|
|critical|用在一段代码临界区之前，保证每次只有一个OpenMP线程进入|
|barrier|用于并行域内代码的线程同步，线程执行到barrier时要停下等待，直到所有线程都执行到barrier时才继续往下执行|

1. **针对LIME算法的多线程优化可能存在的问题**

尽管OpenMP可以很简单的执行对for循环并行化的指令，在实际应用当中必须充分考虑到并行线程间的数据相关性问题。对于本项目的LIME低照度增强算法，代码中存在大量通过for循环遍历像素点的操作，循环体内部的执行操作大多和循环内外层的参数有着直接的关联，例如下面的代码：

    cv::Mat lime:Mat2Vec(cv::Mat mat){  //将多维矩阵压缩成一维

            mat = mat.t(); //现将矩阵转置

            int row_temp = mat.rows;

            int col_temp = mat.cols;

            cv::Mat mat_one(1,row_temp * col_temp, CV_32F);

            for(int i = 0; i < row_temp ; i++){

            for(int j =0; j< col_temp ; j++){

                mat_one.at<float>(0,i*col_temp+j) = mat.at<float>(i,j);

            }

        }

        return mat_one;      

    }

如果采用多线程将外层的循环分给多个线程执行，由于线程的开闭需要一定的时间，因此可能出现外层循环进入到下一个轮次，而内层循环的上一个轮次还未完成的情况，这样，系统就会访问到重复的元素，由于执行操作涉及到图像像素点，因此这样一个错误很有可能造成程序执行错误。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2017.png>)

图 16 OpenMP内存访问错误的情况

在图 16中，内存在列未完成第一个循环的时候就已经访问到了第二行第二列的元素，造成了访问顺序的错乱，第二行第二列像素点可能会被访问两次，并影响到后面像素点的读取。因此，在涉及到图像遍历的循环操作当中使用OpenMP多线程并行加速是很有风险的。如果使用线程保护指令，又难以取得多线程并行带来的速度提升。为了在优化速度的同时又保证程序执行的正确性，需要将OpenMP合理地运用在数据耦合相关性较低的代码段。

4.4.4 色彩通道分离

通过对LIME算法整体代码的深入分析，在图像增强函数的实现部分可以充分的发挥出OpenMP的多线程并行加速的特点。

    cv::Mat lime::enhance(cv::Mat &src){

        __initIllumMap(src);

        cv::Size sz(img_norm.size());

        R = cv::Mat(sz, CV_32F, cv::Scalar::all(0.0));

        std::vector<cv::Mat> img_norm_rgb; // 定义一个存储三通道分量的向量

        cv::Mat img_norm_b, img_norm_g, img_norm_r; // 定义三个矩阵，分别用于存储三个通道的分量

        cv::split(img_norm, img_norm_rgb); // 将归一化图像分解为三个通道

        img_norm_g = img_norm_rgb.at(0); // 获取绿色通道

        img_norm_b = img_norm_rgb.at(1); // 获取蓝色通道

        img_norm_r = img_norm_rgb.at(2); // 获取红色通道

        cv::Mat T = optimizeIllumMap();

        //cv::Mat one = cv::Mat::ones(sz, CV_32F); // 创建一个与输入图像大小相同的全 1 矩阵

        auto g = img_norm_g / T ;// 计算增强后的绿色通道

        auto b = img_norm_b / T; // 计算增强后的蓝色通道

        auto r = img_norm_r / T; // 计算增强后的红色通道

        cv::Mat g1, b1, r1;

        threshold(g, g1, 0.0, 0.0, 3);

        threshold(b, b1, 0.0, 0.0, 3);

        threshold(r, r1, 0.0, 0.0, 3);

        img_norm_rgb.clear();       // 清空 img_norm_rgb 向量

        img_norm_rgb.push_back(g1); // 将处理后的绿色通道添加到向量中

        img_norm_rgb.push_back(b1); // 将处理后的蓝色通道添加到向量中

        img_norm_rgb.push_back(r1); // 将处理后的红色通道添加到向量中

        cv::merge(img_norm_rgb, out_lime); // 将处理后的三个通道合并为一个图像

        out_lime.convertTo(out_lime, CV_8U, 255); // 将 float 类型的图像转换回 uchar 类型，并将像素值范围恢复到 [0, 255]

        return out_lime;

    }

代码段中对RGB三通道分别拆开计算增强后的值然后合并到一起，使用的传统的串行写法，先后计算了绿色、蓝色和红色通道。但是这三个通道实际上是互相独立的，彼此之间并不存在数据耦合关系，不会因为内存访问错误而造成程序执行异常。因此，采用色彩通道分离，此段代码可以使用OpenMP进行多线程并行加速优化。色彩通道分离方法如图 17所示。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2018.png>)

图 17 色彩通道分离图解

如图 17，对函数中G、B、R三个通道，使用OpenMP的parallel特性将三个色彩通道处理部分分成三个独立的代码块(section)，对每一个代码块单独进行色彩的获取、计算和增强。色彩通道分离后的的代码如下：

    cv::Mat lime::enhance(cv::Mat &src){

        __initIllumMap(src);

        cv::Size sz(img_norm.size());

        R = cv::Mat(sz, CV_32F, cv::Scalar::all(0.0));

        std::vector<cv::Mat> img_norm_rgb; // 定义一个存储三通道分量的向量

        cv::Mat img_norm_b, img_norm_g, img_norm_r; // 定义三个矩阵，分别用于存储三个通道的分量

        cv::split(img_norm, img_norm_rgb); // 将归一化图像分解为三个通道

        cv::Mat T = optimizeIllumMap();

        cv::Mat g1, b1, r1;

        #pragma omp parallel sections

        {

            #pragma omp section

            {

                img_norm_g = img_norm_rgb.at(0); // 获取绿色通道

                auto g = img_norm_g / T ;// 计算增强后的绿色通道

                threshold(g, g1, 0.0, 0.0, 3);

            }

            #pragma omp section

            {

                img_norm_b = img_norm_rgb.at(1); // 获取蓝色通道

                auto b = img_norm_b / T; // 计算增强后的蓝色通道

                threshold(b, b1, 0.0, 0.0, 3);

            }

            #pragma omp section

            {

                img_norm_r = img_norm_rgb.at(2); // 获取红色通道

                auto r = img_norm_r / T; // 计算增强后的红色通道

                threshold(r, r1, 0.0, 0.0, 3);

            }

        }

        img_norm_rgb.clear();       // 清空 img_norm_rgb 向量

        img_norm_rgb.push_back(g1); // 将处理后的绿色通道添加到向量中

        img_norm_rgb.push_back(b1); // 将处理后的蓝色通道添加到向量中

        img_norm_rgb.push_back(r1); // 将处理后的红色通道添加到向量中

        cv::merge(img_norm_rgb, out_lime); // 将处理后的三个通道合并为一个图像

        out_lime.convertTo(out_lime, CV_8U, 255); // 将 float 类型的图像转换回 uchar 类型，并将像素值范围恢复到 [0, 255]

        return out_lime;

    }

优化后的代码将每个色彩通道的获取、计算增强以及二值化过程都分别集成到了一个线程中。程序执行中，CPU将同时分配三个线程并行执行这段代码。在采集视频帧的时候，LIME预处理算法需要处理大量的图片，使用多线程并行执行增强函数可以提高处理的速度，有利于项目实时性的落地。

4.4.5 多线程图像分块处理

由于LIME算法处理的图片宽高像素值通常是上百上千的规模，在实际参与运算过程中对于CPU是一笔不小的负荷，尽管在4.3节中已经采取了NEON指令集进行向量化操作对代码中的for循环遍历进行加速，但是面对千百像素规模的图片尺寸，容量为4的NEON向量寄存器显然不能做到规模化的加速效果。为了对这样尺寸的图像做进一步的加速优化，本项目充分利用了OpenMP的多线程并行功能，把算法处理的图像分为四等份，即左上、右上、左下、右下四个部分。每个部分用一个线程去执行，OpenMP的parallel section指令默认调用一个CPU核进行处理，因此对图像四等分之后，使用OpenMP可以充分调度开发板的4个CPU核心进行并行工作，从而提高程序运行效率。OpenMP对图像进行分块处理的原理可以表示为图 18。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2019.png>)

图 18 图像分块并行处理原理图

如图 18，假设CPU遍历每个像素点执行操作消耗的时间相同。不使用分块并行时，遍历图中16个像素单元需要16个时间单元，如果使用了分块并行操作，四个核同时开始工作，每个核遍历完分块内四个像素点只需要四个时间单元。理论上，采用分块并行操作可以提高到原来四倍的速度。

根据图像分块并行的思想，将LIME算法中涉及循环遍历的函数进行优化，代码如下：

    cv::Mat lime::getMax(const cv::Mat& bgr){          //求RGB三个通道的最大值用于构建初始化的光照图

        int startRow, startCol, endRow, endCol;

        cv::Mat temp_mat(row, col, CV_32F, cv::Scalar::all(0.0));

        std::vector<cv::Mat> img_norm_rgb; // 定义一个存储三通道分量的向量

        cv::Mat img_norm_b, img_norm_g, img_norm_r; // 定义三个矩阵，分别用于存储三个通道的分量

        cv::split(bgr, img_norm_rgb); // 将归一化图像分解为三个通道

        img_norm_g = img_norm_rgb.at(0); // 获取绿色通道

        img_norm_b = img_norm_rgb.at(1); // 获取蓝色通道

        img_norm_r = img_norm_rgb.at(2); // 获取红色通道

        #pragma omp parallel sections

        {

            #pragma omp section

            {

                for(int i = 0; i < row/2; i++){

                for(int j = 0; j< col/2; j++){

                    temp_mat.at<float>(i,j) = MAX(MAX(img_norm_g.at<float>(i,j),img_norm_b.at<float>(i,j)), img_norm_r.at<float>(i,j));

                    }

                }

            }

            #pragma omp section

            {

                for(int i = row/2; i < row; i++){

                for(int j = 0; j< col/2; j++){

                    temp_mat.at<float>(i,j) = MAX(MAX(img_norm_g.at<float>(i,j),img_norm_b.at<float>(i,j)), img_norm_r.at<float>(i,j));

                    }

                }

            }

            #pragma omp section

            {

                for(int i = 0; i < row/2; i++){

                for(int j = col/2; j< col; j++){

                    temp_mat.at<float>(i,j) = MAX(MAX(img_norm_g.at<float>(i,j),img_norm_b.at<float>(i,j)), img_norm_r.at<float>(i,j));

                    }

                }

            }

            #pragma omp section

            {

                for(int i = row/2; i < row; i++){

                for(int j = col/2; j< col; j++){

                    temp_mat.at<float>(i,j) = MAX(MAX(img_norm_g.at<float>(i,j),img_norm_b.at<float>(i,j)), img_norm_r.at<float>(i,j));

                    }

                }

            }

        }

        return temp_mat;

    }    

在计算色彩通道最大值函数getMax函数中，每个像素点遍历后执行的操作时比较该点三个色彩通道的最大值，和其他像素带你不存在数据依赖性，不用担心内存访问错误、数据竞争等问题，可以放心地使用分块并行操作。

类似地，在求取矩阵范数的函数Frobenius中，也可以使用分块并行的操作：

float lime::Frobenius(cv::Mat mat){   //求一个矩阵的F范数

            int row = mat.rows;

            int col = mat.cols;

            float total = 0.0;

            float totalsum = 0.0;

        #pragma omp parallel sections

        {

            #pragma omp section

            {

                for(int i = 0; i < row/2; i++){

                for(int j = 0; j< col/2; j++){

                    total = total + pow(mat.at<float>(i,j), 2);

                    }

                }

            }

            #pragma omp section

            {

                for(int i = row/2; i < row; i++){

                for(int j = 0; j< col/2; j++){

                    total = total + pow(mat.at<float>(i,j), 2);

                    }

                }

            }

            #pragma omp section

            {

                for(int i = 0; i < row/2; i++){

                for(int j = col/2; j< col; j++){

                    total = total + pow(mat.at<float>(i,j), 2);

                    }

                }

            }

            #pragma omp section

            {

                for(int i = row/2; i < row; i++){

                for(int j = col/2; j< col; j++){

                    total = total + pow(mat.at<float>(i,j), 2);

                    }

                }

            }

        }

        #pragma omp critical

        {totalsum += total;}

        totalsum = sqrt(totalsum);

        return totalsum;

    }

与求最大值函数不同的是，该函数在遍历像素点的操作中会执行一个平方累加的操作，因此需要在分块区域结束的地方加上一句#pragma omp critical以避免分块线程在访问公共变量totalsum的时候出现数据竞争的现象。

- 1. **优化效果**

表 4 优化效果

|   |   |   |   |
|---|---|---|---|
|**函数**|**未优化**|**傅里叶函数重构**|**NEON+OpenMP**|
|**平均用时（s）**|**1.6305s**|**1.031s**|**0.314s**|

针对256*256图像的傅里叶函数处理，本次优化实现了显著的性能提升：未优化时单图平均耗时1.6305秒，先通过傅里叶函数重构优化逻辑冗余，将耗时降至1.031秒；再叠加Arm Neon指令集（利用SIMD并行提升像素计算效率）与OpenMP多核并行（分块利用CPU资源）的组合优化，最终耗时压缩至0.314秒，相对未优化版本的加速比达5.19倍——既通过函数重构解决了算法低效问题，又借助硬件适配充分释放了ARM平台的算力，将图像增强预处理的耗时从1.6秒级降至0.3秒级，有效突破了无GPU场景下CPU实时处理图像的性能瓶颈，为嵌入式视觉系统的落地提供了性能支撑。

**3.5 重难点分析**

Neon，openmp，循环展开、循环重排原理和用法（理解的越深入越全面越好）

**3.6 重点查看！！——面试常见八股**

**情况介绍：**暑期＋秋招的七八十场面试中，总体来看有一半的面试会问这个项目，有三家问了如何复现算法的：比如经纬恒润的实习和大疆的实习面试，秋招就没有人问过了；其中问此项目的百分百都会问性能优化这个部分。

**1.首先为什么要使用这个与处理算法？**

说法1.比赛要求 2.由于会有亮度不够的情况，需要低照度增强。

**为什么不用GPU加速？**

此开发板是四核的arm v8架构的开发板，四核主频平均2.4Ghz。GPU是amd的一个老款的GPU，不能图像处理，只用来显示。并且实时性要求高，所以此图像处理只能用CPU来处理，所以优化思路是利用其多核CPU特性和提高缓存命中。

**各个优化点的定义**

**Neon**是armv8结构特有的指令集，是SIMD（单指令多数据）指令集，广泛应用于移动设备和嵌入式系统中。通过并行处理多个数据元素，NEON 能够显著提升计算密集型任务（如图像处理、信号处理、视频编解码等）的执行效率。CPU 的执行单元会并发地执行 NEON 指令，允许在一个时钟周期内对多个数据元素进行操作。在代码中的具体应用，使用了哪些指令。还有此neon是调用C++的库，不是汇编。

**Openmp**：OpenMP（Open Multi-Processing）是一种用于统一内存访问的共享内存并行编程的API，它通过在源代码中插入编译指令（pragma），使得开发者能够轻松地将串行代码并行化，以充分利用多核处理器的计算能力

Openmp多少个线程比较好？4个，因为是四核CPU，测试过多和少都会效果正常原因如下：

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2020.png>)

**对比pthread优势**

表 5 对比pthread优势

|   |   |   |
|---|---|---|
|**特性**|**OpenMP**|**Pthread**|
|易用性|编译指令声明，无需手动管理线程|需手动创建 / 销毁线程，代码复杂|
|开销|自动负载均衡，开销低|手动调度，开销高|
|适用场景|数据并行（如图像分块）|复杂任务调度|

**各部分概念：**

**循环重排：**循环重排（Loop Reordering）能够提升缓存命中率的根本原因在于匹配内存存储顺序与访问模式，从而利用计算机体系结构中的缓存预取机制和局部性原理

**循环展开：**为编译器引导的指令级并行（ILP）优化：通过减少循环迭代次数（或完全消除循环），将循环体中的操作重复多次，从而降低循环控制（如分支判断、计数器更新）的开销/**使用点：**

通过循环展开，我们每次加载和处理4个浮点数，而不是逐个处理每个元素。这种方式可以减少循环控制的开销，并且利用 ARM Neon 指令集一次性并行处理4个浮点数，处理四个像素点得 R G B 三通道并求和 操作。​

**Cacheline定义：**

**遇到的困难点：**

由于比赛需要画面的实时性，并且没有GPU来加速与处理算法，所以导致每秒几帧，所以只能用CPU来跑，寻找一些书籍和博客，比如CSAPP中的程序性能优化方法的借鉴，采用neon openmp 循环展开 循环重排等方式提高速度。

**怎么知道的缓存命中率是否增加：**

使用Perf工具查看得知

1. **模型算法及其优化**
    1. **基础概念**

**4.1.1 ncnn：端侧高性能深度学习推理框架**

ncnn 是由腾讯优图实验室开源的轻量级、高性能深度学习推理框架，专为手机、嵌入式等端侧设备设计，核心定位是解决 “深度学习模型在端侧高效落地”的问题：

1. **核心特性：**
    1. 极致轻量化：无第三方依赖，编译后体积极小，适配安卓、iOS、Linux 等端侧系统；
    2. 高性能：针对 ARM 架构 CPU/GPU 做了深度指令优化（如 NEON 加速），推理速度远超传统框架；
    3. 易用性：支持主流深度学习模型（如 CNN、Transformer）的部署，提供 C/C++ API，可直接集成到端侧应用中；
    4. 量化支持：原生支持 INT8/FP16 量化，适配端侧低算力、低存储的场景。
2. **核心用途：**

作为端侧模型推理的 “执行引擎”，负责解析量化后的模型文件，完成输入数据预处理、模型前向推理、输出结果解析全流程，是移动端图像分类、目标检测、人脸识别等 AI 应用的**核心底层框架**。

**4.1.2 PNNX：模型转换与量化工具（适配 ncnn 的核心桥梁）**

PNNX（Pytorch to NCNN eXchanger）是一款一站式模型转换与量化工具，核心作用是打通“训练框架（如PyTorch/TensorFlow）→ONNX→ncnn”的转换链路，同时集成量化能力，解决模型从训练到端侧部署的适配问题：

核心功能：

模型转换：将PyTorch/TensorFlow训练的模型先转为ONNX中间格式，再进一步转换为ncnn支持的.param/.bin模型文件（处理ONNX与ncnn的算子兼容问题，修复转换中的精度丢失）；

模型量化：内置离线INT8量化和FP16伪量化两种方式，无需额外工具即可完成端侧量化优化；

兼容性适配：自动处理训练框架与ncnn之间的算子差异，降低模型转换的适配成本。

与ncnn的关系：PNNX是ncnn生态的核心配套工具，ncnn负责模型推理执行，而PNNX负责将训练好的模型“翻译+优化”为ncnn可识别、可高效运行的格式，是端侧模型落地中“转换+量化”环节的关键工具。

**4.1.3 重点查看！！——模型部署框架**

对于算法科研人员来说，熟练掌握并应用一种深度学习框架是一项必备技能。学术研究人员关心的是研究中算法的迭代速度，其应用场景通常是相对较小的数据集上，最大的限制因素不是性能，而是快速实现并验证假设的能力，使得学术研究倾向于PyTorch。PyTorch是一个针对深度学习，并且使用GPU和CPU来优化的tensor library(张量库)。ncnn（N-CNN）是一个高效的深度学习推理框架，专门针对移动端和嵌入式设备进行优化。它的全称是"网络通道卷积神经网络"（Network Convolutional Neural Network），旨在提供一个轻量级、快速和低功耗的解决方案，以满足在资源受限的设备上进行深度学习推理的需求。此外，ncnn支持混合精度计算，可以在保证模型精度的前提下，使用更低的数值精度进行计算，以减少计算量和内存占用。它还支持多线程并行计算，在多核处理器上充分利用并行计算能力，提高推理速度。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2021.png>)

图 19 模型部署框架

1. **PC 端：模型训练与格式适配（面向开发环境）**

这一阶段的核心是完成模型训练，并将模型转换为适合边缘端运行的轻量化格式：

- 1. 模型训练：以“车道线检测模型”为基础，在PC端（具备较强算力的开发设备）上开展训练，最终得到PyTorch格式模型（PyTorch是常用的深度学习训练框架，格式适合训练调优，但不适合边缘端直接运行）。
    2. 第一次格式转换（PyTorch→Onnx）：通过“pytorch to onnx”工具，将PyTorch模型转换为Onnx格式模型——Onnx是一种跨框架的模型中间格式，可实现不同深度学习框架间的模型兼容，是连接训练与部署的“桥梁”。
    3. 第二次格式转换（Onnx→ncnn）：再通过“onnx to ncnn”工具，将Onnx模型转换为ncnn格式模型——ncnn是专为边缘设备（如嵌入式设备、移动端）设计的轻量化推理框架格式，特点是体积小、运行效率高，能适配边缘端有限的算力资源。

1. **边缘端：模型推理与结果输出（面向部署环境）**

这一阶段的核心是利用转换后的轻量化模型，在边缘端完成车道线检测的实际应用：

1. 数据预处理：将边缘端采集到的“数据集”（实际场景中的道路图像/视频帧）进行预处理（如尺寸裁剪、归一化、通道调整等），使其符合ncnn模型的输入要求。
2. 模型推理：将预处理后的数据输入ncnn格式模型，由边缘端设备（如车载嵌入式芯片、边缘计算盒子）完成推理计算，得到车道线检测的原始输出结果。
3. 数据后处理：对模型推理的原始输出（如特征图、坐标信息）进行后处理（如非极大值抑制、坐标还原、结果过滤等），将其转换为可直接解读的车道线信息。
4. 结果展示：将后处理后的车道线检测结果（如在图像中标记出车道线区域）进行可视化展示，最终完成实际场景中的车道线检测任务。
    1. **Unet模型优化及部署**

**4.2.1 Unet车道线识别数据集构建**

为增强网络模型的鲁棒性和泛化能力，此车道线识别数据集集合了多种开源数据集的5000多张图片，包含2684张原图和2684车道线掩码图，其中图片中既有大场景多车道的图片也有夜晚可见度较低的图片，经过训练的模型能够避免尤其是传统车道线拟合算法鲁棒性非常差的特点。如图 20所示则为数据集中的其中一张图进行举例。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%202.jpeg>) ![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2022.png>)

图 20 数据集的场景原图与车道线掩码图

**4.2.2 Unet网络结构设计与功能**

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2023.png>)

图 21 U-Net结构图

U-Net结构形似字母“U”，被大量应用在分割领域。它是在FCN的基础上构建，它的U型结构解决了FCN无法上下文的信息和位置信息的弊端。分为左半部分（编码器/下采样）和右半部分（解码器/上采样），中间通过“瓶颈层”连接，同时有跳跃连接（灰色箭头）实现特征融合。

**1. 编码器（左半部分：下采样路径）**

功能：提取图像特征，逐步降低空间分辨率、增加通道数。每个阶段包含：

- conv3x3,ReLU（蓝色箭头）：2次3×3卷积+ReLU激活（图中蓝色方块为卷积块），提取局部特征。
- maxpool2x2（红色箭头）：2×2最大池化，将特征图尺寸减半（如568×568→284×284），通道数翻倍（如64→128）。

最终得到瓶颈层（图中最底部的1024通道层）：最深的抽象特征表示。

**2. 解码器（右半部分：上采样路径）**

功能：恢复空间分辨率，生成与输入尺寸匹配的分割图。每个阶段包含：

- up-conv2x2（绿色箭头）：2×2转置卷积（上采样），将特征图尺寸翻倍（如28×28→56×56），通道数减半（如1024→512）。
- copy and crop（灰色箭头）：跳跃连接——将编码器对应层级的特征图（裁剪后）与当前上采样后的特征图拼接（如512通道+512通道→1024通道）。
- conv3x3,ReLU（蓝色箭头）：再次通过2次3×3卷积+ReLU，融合拼接后的特征。

**3. 输出层（最右侧）**

通过conv1x1（青色箭头）：用1×1卷积将通道数调整为类别数（图中输出为2通道，对应二分类分割），得到最终的“分割图（output segmentation map）”**。**

**4.2.3 底层网络的创新**

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2024.png>)

图 22 原始unet权重文件大小

经过一千轮训练后，生成的pth文件大小为124MB如图 22所示。此权重文件的内部权重大小为fp32，虽然可以量化为uint8型但是量化后的权重文件大小可以达到31mb,但是这个权重文件大小对于一些极端的硬件来说还是过大了。因此我们团队采取一些从底层网络创新的方法，能大量减少网络的参数量的同时，使其精度降低在车道线应用场景中可以接受的范围之内，并在此基础上使精度尽可能的高。

首先我们通过mobile-net的启发，引入深度可分离卷积来减少整个网络的参数量，被减少参数量能减少数据所占带宽同时减少数据的计算次数，因此可以直观的对模型进行“瘦身”。

一些轻量级的网络，如mobilenet中，会有深度可分离卷积depthwise separable convolution，由depthwise(DW)和pointwise(PW)两个部分结合起来，用来提取特征feature map。相比常规的卷积操作，其参数数量和运算成本比较低。

具体内容参考该文档学习：[深入浅出理解深度可分离卷积（Depthwise Separable Convolution）_dwconv-CSDN博客](https://blog.csdn.net/m0_37605642/article/details/134174749)

pytorch代码实现

1. class DepthWiseConv(nn.Module):
2.     def __init__(self,in_channel,out_channel):
3.         super(DepthWiseConv, self).__init__()
4.         # 逐通道卷积
5.         self.depth_conv = nn.Conv2d(in_channels=in_channel,
6.                                     out_channels=in_channel,
7.                                     kernel_size=3,
8.                                     stride=1,
9.                                     padding=1,
10.                                     groups=in_channel)
11.         # groups是一个数，当groups=in_channel时,表示做逐通道卷积
12.         #逐点卷积
13.         self.point_conv = nn.Conv2d(in_channels=in_channel,
14.                                     out_channels=out_channel,
15.                                     kernel_size=1,
16.                                     stride=1,
17.                                     padding=0,
18.                                     groups=1)

20.    def forward(self,input):
21.         out = self.depth_conv(input)
22.         out = self.point_conv(out)
23.         return out

上述代码实现了深度可分离卷积替换普通卷积，我们首先采用x86平台下先进行测试。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2025.png>)

图 23 经过通道可分离后unet权重文件大小

通过图 23，首先文件大小从124MB直接缩小到了24.2MB，参数量直接缩小了五倍，接下来我们再来看一下推理图片的结果。这里我们需要引入DICE，一种评估机制，来反映图片分割的效果。

Dice Loss最先是在VNet这篇文章中被提出，后来被广泛的应用在了医学影像分割之中。Dice系数是一种集合相似度度量函数，通常用于计算两个样本的相似度，取值范围在[0,1]：

（1）

Dice的计算公式为式(5-24)且是在图像分割任务中常用的评估指标之一。它用于衡量分割结果与真实标签之间的相似度，越接近于1表示分割结果与真实标签越相似，越接近于0表示分割结果与真实标签越不相似。

DICE = 2 * (Intersection) / (Union + Intersection)其中，Intersection代表分割结果和真实标签的正样本交集，Union代表分割结果和真实标签的正样本并集。

DICE指标在图像分割中具有以下优点：

敏感度：DICE指标对于分割结果中正样本的检测具有较高的敏感性，能够准确评估分割结果与真实标签的相似度。

不受样本不平衡影响：DICE指标在处理样本不平衡的情况下仍然有效。它将分割结果和真实标签的正样本交集和并集作为评估依据，能够客观地衡量正样本的匹配情况。

直观理解：DICE指标的取值范围在0到1之间，更接近于1表示分割结果与真实标签的相似度更高，更接近于0表示相似度更低。这种直观的度量方式使得DICE指标易于理解和解释。

以下是一张原图，与数据标注图，和更改后的网络之间预测效果对比图。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%203.jpeg>)

图 24 测试集原始图

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2026.png>)

(a) ground truth

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2027.png>)

(b) 原始unet

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2028.png>)

(c) 经过通道可分离

图 25 数据标注图

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2029.png>)

图 26 测试集准确率和推理时间的对比

根据图 26我们可以得到整个推理过程的各种参数将下列参数整理成为表 6。

表 6 通道可分离卷积和朴素卷积在unet上的对比

|   |   |   |
|---|---|---|
||没有经过更改的Unet|经过深度可分离卷积更改后的Unet|
|DICE|0.930|0.845|
|python下在x86平台的推理速度|1.59 seconds|1.06 seconds|
|权重文件大小|124MB|24MB|
|注：在cpu全力运转环境下，参数量减少带来的加速比将会更加明显，甚至速度能够提升至2.5到3倍，其中权重文件大小是在float32精度条件下生成的。|   |   |

其中精度掉了大约0.085，但是速度提升了接近1.5倍。虽然通道可分离卷积在实践中具有许多优点，但也存在一定的精度损失。

**4.2.4 部署ncnn框架**

1. **ncnn嵌入式部署框架**

ncnn 是一个为手机端极致优化的高性能神经网络前向计算框架。 ncnn 从设计之初深刻考虑arm端（手机端）的部署和使用。无第三方依赖，跨平台，arm平台 cpu 的速度快于目前所有已知的开源框架。基于ncnn，开发者能够将深度学习算法轻松移植到arm平台高效执行。

我们想要部署到arm平台前，首先需要把训练所得的pth文件打包成pt文件,pth文件（.pth）：pth文件也是指PyTorch模型文件的一种扩展名。与pt文件相比，pth文件通常只包含了模型的参数和权重信息，而不包含完整的模型定义。pth文件的优势在于更小的文件大小，因为它只保存了模型的权重数据，而不保存模型的结构。pth文件可以使用torch.save()函数以指定的后缀名（例如.pth）保存模型参数，并使用torch.load()函数加载。

pt文件是指PyTorch模型文件的一种常见扩展名。通常，pt文件包含了完整的模型定义、参数和权重等信息。pt文件可以使用PyTorch的torch.save()函数保存，并使用torch.load()函数加载。pt文件还可以存储其他与模型相关的元数据和状态信息。我们需要可以在预测阶段后调用PyTorch的api将pth文件打包成pt，文件如图 27所示。

1. traced_script_module = torch.jit.trace(net,input)
2. traced_script_module.save("model.pt")

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2030.png>)

图 27 通过调用pytorch api实现的model.pt文件

1. **ncnn环境搭建**

首先我们需要g++编译器，cmake工具，protobuf还有opencv库的安装。由于前几章已经介绍了编译器和cmake的安装工作，所以接下来我们着重来讲解一下protobuf和opencv的安装。

1. $ sudo apt-get install autoconf automake libtool curl make g++ unzip
2. $ git clone https://github.com/google/protobuf.git
3. $ cd protobuf
4. $ git submodule update --init --recursive
5. $ ./autogen.sh
6. $ ./configure
7. $ make
8. $ make check
9. $ sudo make install
10. $ sudo ldconfig  _#refresh shared library cache._

opencv的源代码文件可以从https://opencv.org/releases/中下载。

下面以opencv-4.7.0进行举例，

1. $ unzip opencv-4.7.0.zip 
2. $ cd opencv-4.7.0/
3. $ mkdir build
4. $ cd build/
5. $ cmake -D CMAKE_BUILD_TYPE=Release -D CMAKE_INSTALL_PREFIX=/usr/local ..
6. $ sudo make install
7. # 查看opencv版本
8. $ pkg-config --modversion opencv

ncnn的环境搭建好之后就可以进行安装了

1. $ git clone https://github.com/Tencent/ncnn
2. $ cd <ncnn-root-dir>
3. $ mkdir -p build
4. $ cd build
5. $ cmake ..
6. $ make -j4
7. $ sudo make install

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2031.png>)

图 28 ncnn安装成功后build文件夹下的工具

至此ncnn的安装工作就全部完成了。

1. **模型量化与部署**

在做训练模型转部署模型的时候，通常都是先转成onnx，再转目标框架，但是经常会出现的问题就是某些算子不支持，这样一来，模型部署起来就比较困难，不过现在ncnn支持[torch](https://so.csdn.net/so/search?q=torch&spm=1001.2101.3001.7020)直接通过pnnx转成ncnn模型，将整个torch的模型直接搬过来，避免了算子不支持的问题。

pytorch的模型还需要使用jit序列化为libtorch的pt模型后才可以使用pnnx进行转换，这就是为什么我们要经过trace_script_module步骤的原因。

打开终端进入pnnx所在的文件夹。输入如下转换命令

1. ./pnnx MobileNetV1Enhance.pt inputshape=[1,3,32,224] inputshape2=[1,3,32,448]

就可以得到如图 29 model.ncnn.bin和model.ncnn.param两个文件，这两个文件便是ncnn框架下的权重文件和网络的结构文件。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2032.png>)

图 29 model.ncnn.bin和model.ncnn.param

通过ncnn的量化工具自动将权重文件从fp32转换为fp16。推理速度将会提升，量化可以减少模型的计算量和内存访问需求，从而加快推理速度。量化后的模型需要进行的计算操作更简单，占用更少的存储空间，因此可以更快地执行推理任务。特别是在资源受限的设备上。

我们得到模型之后就可以使用ncnn库内自带的一些函数来进行C++的落地部署了。实际部署的代码如下所示：

#include "net.h"

#include <opencv2/opencv.hpp>

#include <string>

#include <vector>

#include <time.h>

#include <algorithm>

#include <map>

#include <iostream>

#include <opencv2/opencv.hpp>

using namespace std;

using namespace cv;

#define INPUT_WIDTH     720

#define INPUT_HEIGHT    720

int main(int argc, char** argv) {

    if (argc < 2) {

        printf("illegal parameters!");

        exit(0);

    }

    ncnn::Net Unet;

    Unet.load_param("../models/model.ncnn.param");

    Unet.load_model("../models/model.ncnn.bin");

    int64 tic, toc;

    tic = cv::getTickCount();

    cv::Scalar value = Scalar(0,0,0);

    cv::Mat src;

    cv::Mat tmp;

    src = cv::imread(argv[1]);

    float width = src.size().width;

    float height = src.size().height;

    int top = 0, bottom = 0;

    int left = 0, right = 0;

    if (width > height) {

        top = (width - height) / 2;

        bottom = (width - height) - top;

        cv::copyMakeBorder(src, tmp, top, bottom, 0, 0, BORDER_CONSTANT, value);

    } else {

        left = (height - width) / 2;

        right = (height - width) - left;

        cv::copyMakeBorder(src, tmp, 0, 0, left, right, BORDER_CONSTANT, value);

    }

    top = (INPUT_HEIGHT*top)/width;

    bottom = (INPUT_HEIGHT*bottom)/width;

    left = (INPUT_WIDTH*left)/height;

    right = (INPUT_WIDTH*right)/height;

    std::cout << "top " << top << " bottom " << bottom << " left " << left << " right " << right << std::endl;

    cv::Mat tmp1;

    cv::resize(tmp, tmp1, cv::Size(INPUT_WIDTH, INPUT_HEIGHT), INTER_CUBIC);

    cv::Mat image;

    tmp1.convertTo(image, CV_32FC3, 1/255.0);

    std::cout << "image element type "<< image.type() << " " << image.cols << " " << image.rows << std::endl;

float *srcdata = (float*)image.data;

    float *data = new float[INPUT_WIDTH*INPUT_HEIGHT*3];

    for (int i = 0; i < INPUT_HEIGHT; i++)

       for (int j = 0; j < INPUT_WIDTH; j++)

           for (int k = 0; k < 3; k++) {

              data[k*INPUT_HEIGHT*INPUT_WIDTH + i*INPUT_WIDTH + j] = srcdata[i*INPUT_WIDTH*3 + j*3 + k];

           }

    ncnn::Mat in(image.rows*image.cols*3, data);

    in = in.reshape(720, 720, 3);ncnn::Extractor ex = Unet.create_extractor();

    ex.set_light_mode(true);

    ex.set_num_threads(4);

    ex.input("in0", in);

    ncnn::Mat mask;ex.extract("out0", mask); std::cout << "whc " << mask.w << " " << mask.h << " " << mask.c << std::endl;

#if 1

    cv::Mat cv_img = cv::Mat::zeros(INPUT_WIDTH,INPUT_HEIGHT,CV_8UC1);#if 1

         float tmp = srcdata[0*mask.w*mask.h+i*mask.w+j];

         int maxk = 0;

         for (int k = 0; k < mask.c; k++) {

           if (tmp < srcdata[k*mask.w*mask.h+i*mask.w+j]) {

             tmp = srcdata[k*mask.w*mask.h+i*mask.w+j];

             maxk = k;

           }

           _//std::cout << srcdata[k*mask.w*mask.h+i*mask.w+j] << std::endl;_

         }

         data[i*INPUT_WIDTH + j] = maxk;

         if ((left > 0) && (right > 0) && ((j < left) || (j >= INPUT_WIDTH - right)))

           data[i*INPUT_WIDTH + j] = 0;

         if ((top > 0) && (bottom > 0) && ((i < top) || (i >= INPUT_HEIGHT - bottom)))

           data[i*INPUT_WIDTH + j] = 0;cv_img *= 255;

    cv::Mat result;

、    image.copyTo(result);

    result.setTo(cv::Scalar(0,0,255),cv_img);

    cv::imwrite("result.jpg", result);

    cv::imshow("test", result);

    cv::waitKey();

#endif

    return 0;

}

进行cmake链接make编译后生成可执行文件ncnn_unet,在终端输入

./ncnn_unet ../images/test.jpg

即可生成对应的推理图。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2033.png>)

图 30 轻量级模型文件生成的预测图

1. **ncnn框架优化加速比测试**

对同一张车道线场景图，分别使用pytorch框架和ncnn框架部署unet模型，对进行识别的效果和速度进行比较，结果如图 31和图 32所示：

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%204.jpeg>)

(a) 基于pytorch框架的识别效果

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%205.jpeg>)

(b) 基于ncnn框架的识别效果

图 31 不同框架的识别效果

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2034.png>)

(a) 基于pytorch框架的识别时间

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%206.jpeg>)

(b) 基于ncnn框架的识别时间

图 32 不同框架的识别时间

从图5-19、5-20可以看出，在ncnn框架的优化下，unet模型识别车道线消耗的时间大幅度减少，从17秒减少到了6秒，速度快了两倍多。观察识别效果，ncnn框架下的识别效果略逊于pytorch框架下，体现在一些受到车辆遮挡的地方以及镜头远处，这是模型在ncnn框架下量化剪枝，为了提高识别速度所作出的一点牺牲。实验表明，在基于Arm平台且GPU不能使用cuda等常用神经网络加速工具的条件下，ncnn框架部署模型在轻量化运算加速和维持识别准确率之间做出了很好的平衡。

- 1. **LSTR模型优化及部署**

基于语义分割的Unet模型以及自动驾驶领域中其他主流的车道线识别模型工作流水线都是先对车道线进行特征提取，分割出车道线，然后再做后处理，聚合识别出的特征点集。这样的识别方式虽然可以实现很高的精度，但是在实际落地应用时，如果部署的硬件设备没有强大的GPU算力，难以在短时间内完成特征点的提取聚合，对于像本项目中的开发板类似的轻量嵌入式设备难以达到满足较高的实时性。为了尽最大可能缩减模型尺寸，提高识别速度，本项目在对Unet模型进行优化加速的同时，对基于注意力机制的transformer网络模型(以下简称LSTR）应用了端到端的车道线识别方法，并在onnx框架上完成了部署。

- - 1. **核心结构介绍**

LSTR是2021年提出的基于Transformer的车道线检测模型，核心优势是利用Transformer的全局注意力机制捕捉车道线的长距离连续性，适配低光照、雨天等复杂场景，同时可通过轻量化改造实现高效部署。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2035.png>)

图 33 LSTR结构图

LSTR摒弃传统CNN依赖局部卷积的局限，采用“**特征提取骨干网络（Backbone）→Transformer编码器（Encoder）→Transformer解码器（Decoder）→车道线预测头（含FFNs）”**的端到端架构，整体流程可概括为：

1. 从原始图像提取低分辨率高语义特征；
2. 通过Encoder捕捉特征的全局关联（解决车道线连续性问题）；
3. 通过Decoder结合初始查询与编码特征，生成车道级特征；
4. 由预测头输出车道线曲线参数，完成检测。

**4.3.2 结构具体介绍及其输入输出分析**

1. **特征提取骨干网络（Backbone）：图像→低维语义特征**
2. **结构具体介绍**

- 基础架构：采用预训练的 ResNet-18/34，**移除全连接层**，仅保留卷积层、池化层与 BatchNorm（BN）层；
- 核心作用：将高分辨率原始图像转换为低分辨率、高语义的特征图。

1. **输入输出分析**

表 7 输入输出分析

|   |   |
|---|---|
|类型|具体内容|
|输入|原始车道场景图像（I）<br><br>-来源：真实道路采集的RGB图像；<br><br>-预处理：resize到固定尺寸（如368×640）、归一化像素值；<br><br>-维度：[B,3,H₀,W₀]（B=批量大小，3=RGB通道，H₀/W₀=图像高/宽）。|
|输出|低分辨率语义特征图（F）<br><br>-维度：[B,C,H,W]（C=特征通道数，如256；H/W=下采样后特征图高/宽，如23×40）；<br><br>-特征语义：包含车道线的局部纹理、轮廓及场景上下文（如路面、护栏区分）。|
|关键说明|输出的特征图将直接作为TransformerEncoder的输入原料，下采样倍数由ResNet骨干的池化层决定（通常下采样8~16倍）。|

1. **Transformer 编码器（Encoder）：特征图→全局关联序列**
2. **结构具体介绍**

- 核心组件：多层 “多头自注意力（MHSA）+ 前馈网络（FFN）;
- 核心作用：将 Backbone 输出的特征图转化为 “带空间位置信息的序列”，通过 MHSA 捕捉车道线的长距离连续性，获取全局信息。

1. **输入输出分析**

表 8 输入输出分析

|   |   |
|---|---|
|类型|具体内容|
|输入|由两部分组成，需先对齐维度后融合：<br><br>**1.压缩序列（S）**<br><br>-来源：Backbone输出的特征图（F）；<br><br>-语义：每个元素对应特征图上一个空间位置的语义特征。<br><br>**2.位置嵌入（Eₚ）**<br><br>-来源：预定义的绝对位置编码（正弦/余弦编码）；<br><br>-维度：与S一致（[B,H×W,C]）；<br><br>-作用：补充空间位置信息（避免序列平铺后丢失像素位置关系）。|
|输出|全局关联编码序列（Sₑ）<br><br>- 维度：[B, H×W, C]（与输入序列维度一致）；<br><br>- 特征语义：每个序列元素不仅包含**自身空间特征**，还融合了**全局其他位置的关联信息**（如左车道与右车道的相对位置、遮挡片段与完整车道的关联）。|

1. **Transformer 解码器（Decoder）：编码序列 + 初始查询→车道级特征**
2. **结构具体介绍**
3. 核心组件：多层“自注意力（Self-Attention）+交叉注意力（Cross-Attention）+FFN”；
4. 核心作用：解决车道检测“预测数量不确定”“车道位置区分”“关联图像特征”三大问题，**将Encoder的全局特征转化为“对应预设车道数的特征序列”**（每条序列对应一条潜在车道）。
5. **输入输出分析**

表 9 输入输出分析

|   |   |
|---|---|
|类型|具体内容|
|输入|由三部分组成，需统一维度为[B,N,C]（N=预设最大车道数，如7）：<br><br>1.**初始查询序列（S_q）**<br><br>-来源：人工初始化；<br><br>-生成方式：全0矩阵或随机张量，维度[B,N,C]；<br><br>-作用：为Decoder提供“启动锚点”，预留N个潜在车道的位置。<br><br>**2.学习位置嵌入（E_LL）**<br><br>-来源：可学习参数矩阵（随模型训练更新）；<br><br>-维度：[B,N,C]；<br><br>-作用：建模“车道级全局位置差异”（如左1车道、中间车道、右1车道的位置语义）。<br><br>**3.编码器输出（Sₑ）**<br><br>-来源：TransformerEncoder的输出序列；<br><br>-维度：[B,H×W,C]；<br><br>-作用：作为Cross-Attention的“键（K）/值（V）”，让Decoder关联图像的空间特征。|
|输出|**车道级解码序列（S_d）**<br><br>-维度：[B,N,C]（与初始查询序列维度一致）；<br><br>-特征语义：每个序列元素**对应一条潜在车道的“全局特征”**，包含车道的位置、形状趋势（如弯曲/直线）等信息，未对应真实车道的元素为“背景特征”。|
|关键说明|Decoder的注意力机制分工：Self-Attention处理S_q内部关联（区分N条潜在车道），Cross-Attention关联S_d与Sₑ（让车道特征与图像对齐）；N需提前根据场景设定（如城市道路设N=5，高速路设N=7）。|

1. **车道线预测头（含FFNs）：解码序列→车道线曲线参数**
2. **结构具体介绍**
3. 核心组件：前馈网络（FFNs）+置信度过滤模块+匈牙利损失计算单元；
4. 核心作用：将Decoder输出的车道级特征转化为具体的车道线曲线参数，通过损失优化预测精度，同时过滤低置信度结果避免车道线断裂。
5. **输入输出分析**

表 10 输入输出分析

|   |   |
|---|---|
|类型|具体内容|
|输入|分两部分，分别用于“预测生成”和“损失计算”：<br><br>**1.FFNs输入：**解码序列（S_d）<br><br>-来源：TransformerDecoder的输出；<br><br>-维度：[B,N,C]；-作用：作为FFNs的特征输入，生成车道线参数。<br><br>**2.匈牙利损失输入：**预测曲线（H）+真实曲线（L）-预测曲线（H）：<br><br>来源为FFNs输出，由“车道标签（如左/右车道）+曲线参数（如多项式系数）”组成，维度[B,N,K]（K=参数数量）；<br><br>-真实曲线（L）：来源为数据集标注，由人工标注的车道像素点拟合生成，维度与H一致；<br><br>-作用：通过匈牙利算法计算“预测-真实”的匹配损失，优化模型精度。|
|输出|**最终车道线检测结果（R）**<br><br>-内容：每个批次内的有效车道线曲线（过滤低置信度结果），包含“车道类别（左/中/右）+连续坐标点（如50个(x,y)）+置信度”；<br><br>-维度：[B,M,T]（M=实际检测到的车道数，M≤N；T=坐标点数量，如50）；<br><br>-特征语义：直接输出可用于后续导航的车道线形状（适配弯曲、遮挡场景）。|
|关键说明|置信度过滤模块：对FFNs输出的锚点置信度（如<0.5）进行平滑插值，避免低光噪声导致的车道线断裂；FFNs的核心作用是将高维特征（C维）映射为低维曲线参数（K维），实现“特征→参数”的转换。|

**4.3.3 onnx C++部署LSTR**

1. **pth模型转onnx**

项目部署用的onnx模型是基于论文《End-to-end Lane Shape Prediction with Transformers》作者github仓库中训练好的pth模型文件，使用pytorch转onnx工具：

# 加载权重

model_path = 'lstr_360x640.pth'

device = torch.device('cpu') #基于cpu

model_statedict = torch.load(model_path, map_location=device) #保存为字典模式

model.load_state_dict(model_statedict)

model.to(device)

model.eval() #使用eval模式保证BN和dropout不发生变化

input_data = torch.randn(1, 3, 360, 640, device=device)

# 转化为onnx模型

input_names = ['input']

output_names = ['output']

torch.onnx.export(model, input_data, 'lstr_360x640.onnx', opset_version=9, verbose=True, input_names=input_names, output_names = output_names)

代码中使用state_dict()字典模式保存模型，使用的时候可以直接加载。使用model.eval()是保证BN层能够用全部训练数据的均值和方差，即测试过程中要保证BN层的均值和方差不变。对于Dropout，model.eval()是利用到了所有网络连接，即不进行随机舍弃神经元。

1. **onnx模型的部署**

在onnxruntime github官网仓库下载源码包进行编译，安装框架到开发板上。从编译好的文件夹下面拷贝出onnx模型运行需要的所有头文件，如图 34所示：

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%207.jpeg>)

图 34 onnx框架依赖

结合onnx框架的特性以及端到端车道线识别算法的步骤，构造类LSTR代码如下：

class LSTR

{

public:

LSTR();

Mat detect(Mat& cv_image);

~LSTR(); // 析构函数, 释放内存

private:

void normalize_(Mat img); // 图像归一化函数

int inpWidth; // 输入图像宽度

int inpHeight; // 输出图像宽度

vector<float> input_image_; // 存储归一化后的图像数据

vector<float> mask_tensor; // 存储预测的掩码数据

float mean[3] = { 0.485, 0.456, 0.406 }; // 图像归一化均值

float std[3] = { 0.229, 0.224, 0.225 }; // 图像归一化标准差

const int len_log_space = 50;

float* log_space;

// 车道线颜色数组

const Scalar lane_colors[8] = { Scalar(68,65,249), Scalar(44,114,243),Scalar(30,150,248),Scalar(74,132,249),Scalar(79,199,249),Scalar(109,190,144),Scalar(142, 144, 77),Scalar(161, 125, 39) };

Env env = Env(ORT_LOGGING_LEVEL_ERROR, "LSTR"); // ONNX Runtime 环境

Ort::Session *ort_session = nullptr; // ONNX Runtime 会话指针

const ORTCHAR_T* model_path; // 模型路径

SessionOptions sessionOptions = SessionOptions(); // 会话选项

vector<const char*> input_names; // 输入节点名称

vector<const char*> output_names; // 输出节点名称

vector<AllocatedStringPtr> inputNodeNameAllocatedStrings; // 输入节点名称的内存分配指针

vector<AllocatedStringPtr> outputNodeNameAllocatedStrings;

vector<vector<int64_t>> input_node_dims; // >=1 outputs // 输入节点维度

vector<vector<int64_t>> output_node_dims; // >=1 outputs // 输出节点维度

};

LSTR构造函数如下，构造函数的主要功能是加载模型、获取输入和输出节点的信息、设置输入图像的尺寸、调整掩码数据的大小、加载拟合多项式参数数据。

LSTR::LSTR()

{

const ORTCHAR_T* model_path = "../lstr_360x640.onnx"; // 模型文件路径

sessionOptions.SetGraphOptimizationLevel(ORT_ENABLE_BASIC); // 设置会话的图优化级别为基本优化级别

ort_session = new Session(env, model_path, sessionOptions); // 创建 ONNX Runtime 会话对象，并加载模型

size_t numInputNodes = ort_session->GetInputCount(); // 获取输入节点数量

size_t numOutputNodes = ort_session->GetOutputCount(); // 获取输出节点数量

AllocatorWithDefaultOptions allocator; // 创建内存分配器对象

// 处理输入节点

for (int i = 0; i < numInputNodes; i++)

{

Ort::AllocatedStringPtr input_name_Ptr = ort_session->GetInputNameAllocated(i, allocator); //获取输入节点名称

inputNodeNameAllocatedStrings.push_back(std::move(input_name_Ptr)); // 将输入节点名称的内存分配指针添加到容器中

input_names.push_back(inputNodeNameAllocatedStrings.back().get()); // 将输入节点名称添加到容器中

Ort::TypeInfo input_type_info = ort_session->GetInputTypeInfo(i); // 获取输入节点的类型信息

auto input_tensor_info = input_type_info.GetTensorTypeAndShapeInfo(); // 获取输入节点的张量类型和形状信息

auto input_dims = input_tensor_info.GetShape(); // 获取输入节点的维度信息

input_node_dims.push_back(input_dims); // 将输入节点的维度信息添加到容器中

}

// 处理输出节点,与输入类似

for (int i = 0; i < numOutputNodes; i++)

{

Ort::AllocatedStringPtr output_name_Ptr= ort_session->GetOutputNameAllocated(i, allocator);

outputNodeNameAllocatedStrings.push_back(std::move(output_name_Ptr));

output_names.push_back(outputNodeNameAllocatedStrings.back().get());

Ort::TypeInfo output_type_info = ort_session->GetOutputTypeInfo(i);

auto output_tensor_info = output_type_info.GetTensorTypeAndShapeInfo();

auto output_dims = output_tensor_info.GetShape();

output_node_dims.push_back(output_dims);

}

this->inpHeight = input_node_dims[0][2]; // 设置输入图像的高度

this->inpWidth = input_node_dims[0][3]; // 设置输入图像的宽度

this->mask_tensor.resize(this->inpHeight * this->inpWidth, 0.0); // 调整掩码数据的大小为图像高度乘以图像宽度，并初始化为0

log_space = new float[len_log_space];

//log_space用于存储拟合车道线形状的多项式系数

FILE* fp = fopen("../log_space.bin", "rb");

fread(log_space, sizeof(float), len_log_space, fp);//导入数据

fclose(fp);//关闭文件。

}

检测及绘制车道线代码如下：

Mat LSTR::detect(Mat& srcimg)

{

const int img_height = srcimg.rows;

const int img_width = srcimg.cols;

Mat dstimg;

// 调整输入图像的大小为网络模型的输入尺寸

resize(srcimg, dstimg, Size(this->inpWidth, this->inpHeight), INTER_LINEAR);

// 归一化处理调整后的图像

this->normalize_(dstimg);

array<int64_t, 4> input_shape_{ 1, 3, this->inpHeight, this->inpWidth }; // 输入张量的形状

array<int64_t, 4> mask_shape_{ 1, 1, this->inpHeight, this->inpWidth }; // 掩码张量的形状

auto allocator_info = MemoryInfo::CreateCpu(OrtDeviceAllocator, OrtMemTypeCPU);

// 存储输入张量的向量

vector<Value> ort_inputs;

ort_inputs.push_back(Value::CreateTensor<float>(allocator_info, input_image_.data(), input_image_.size(), input_shape_.data(), input_shape_.size()));

ort_inputs.push_back(Value::CreateTensor<float>(allocator_info, mask_tensor.data(), mask_tensor.size(), mask_shape_.data(), mask_shape_.size()));

// 运行推理过程，获取输出张量

vector<Value> ort_outputs = ort_session->Run(RunOptions{ nullptr }, input_names.data(), ort_inputs.data(), 2, output_names.data(), output_names.size());

// 获取预测的逻辑张量数据

const float* pred_logits = ort_outputs[0].GetTensorMutableData<float>();

// 获取预测的曲线张量数据

const float* pred_curves = ort_outputs[1].GetTensorMutableData<float>();

const int logits_h = output_node_dims[0][1]; // 逻辑张量的高度

const int logits_w = output_node_dims[0][2]; // 逻辑张量的宽度

const int curves_w = output_node_dims[1][2]; // 曲线张量的宽度

vector<int> good_detections; // 存储有效的检测结果索引

vector< vector<Point>> lanes; // 存储检测到的车道线点的集合

for (int i = 0; i < logits_h; i++)

{

float max_logits = -10000;

int max_id = -1;

for (int j = 0; j < logits_w; j++)

{

const float data = pred_logits[i*logits_w + j]; // 获取逻辑张量中指定位置的数据

if (data > max_logits)

{

max_logits = data;

max_id = j;

}

}

if (max_id == 1)

{

good_detections.push_back(i); // 将有效的检测结果索引添加到 good_detections 向量中

const float *p_lane_data = pred_curves + i * curves_w;

vector<Point> lane_points(len_log_space);

for (int k = 0; k < len_log_space; k++)

{

// 计算车道线点的 y 坐标

const float y = p_lane_data[0] + log_space[k] * (p_lane_data[1] - p_lane_data[0]);

// 计算车道线点的 x 坐标

const float x = p_lane_data[2] / powf(y - p_lane_data[3], 2.0) + p_lane_data[4] / (y - p_lane_data[3]) + p_lane_data[5] + p_lane_data[6] * y - p_lane_data[7];

// 构建车道线点坐标并添加到 lane_points 向量中

lane_points[k] = Point(int(x*img_width), int(y*img_height));

}

lanes.push_back(lane_points);

}

}

/// draw lines

vector<int> right_lane; // 存储右侧车道线索引

vector<int> left_lane; // 存储左侧车道线索引

for (int i = 0; i < good_detections.size(); i++)

{

if (good_detections[i] == 0) // 将索引为 0 的检测结果视为右侧车道线

{

right_lane.push_back(i);

}

if (good_detections[i] == 5) // 将索引为 5 的检测结果视为左侧车道线

{

left_lane.push_back(i);

}

}

Mat visualization_img = srcimg.clone(); // 创建用于可视化的图像副本

if (right_lane.size() == left_lane.size()) // 如果右侧和左侧车道线数量相等

{

Mat lane_segment_img = visualization_img.clone(); // 创建车道线分割图像的副本

vector<Point> points = lanes[right_lane[0]]; // 获取右侧车道线的点集

reverse(points.begin(), points.end()); // 反转点集，以便绘制封闭区域

// 将左侧车道线的点集插入到右侧车道线点集之前

points.insert(points.begin(), lanes[left_lane[0]].begin(), lanes[left_lane[0]].end());

// 绘制封闭区域（车道线分割区域）

fillConvexPoly(lane_segment_img, points, Scalar(0, 255, 0));

// 将车道线分割区域与原始图像进行叠加

addWeighted(visualization_img, 0.4, lane_segment_img, 0.6, 0, visualization_img);

}

for (int i = 0; i < lanes.size(); i++)

{

for (int j = 0; j < lanes[i].size(); j++)

{

circle(visualization_img, lanes[i][j], 3, lane_colors[good_detections[i]], -1);

}

}

return visualization_img; // 返回可视化结果图像

}

1. **模型运行测试**

使用部署好的onnx模型分别对两张白天、一张夜晚使用LIME算法增强的车道线图片进行识别，识别结果如图 35、图 36、图 37所示。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%208.jpeg>) ![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%209.jpeg>)

图 35 LSTR-onnx模型识别效果图（一）

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2010.jpeg>) ![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2036.png>)

图 36 LSTR-onnx模型识别效果图（二）

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2011.jpeg>) ![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2037.png>)

图 37 LSTR-onnx模型识别效果图（三）

模型识别三张图的时间如图 38所示：

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2012.jpeg>)

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2013.jpeg>)

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2014.jpeg>)

图 38 模型识别时间

由图 38可见，模型识别一张图平均用时稳定在0.18-0.19s，速度相比unet有了很大的提升，这得益于端到端的识别算法，预先定义的车道线拟合多项式大大减少了传统深度学习算法特征匹配聚合消耗的时间；另一方面，onnx框架本身具有优秀的可移植性以及高性能的推理引擎，可以充分发挥开发板的硬件优化功能进行加速。

- 1. **Unet和LSTR测试效果的对比**

以 “低光照车道线检测与分割” 为测试场景（测试集：自制低光数据集，包含 1000 帧图像，涵盖逆光、雨夜、隧道暗光等场景，标签为车道线分割掩码与车道线坐标），对比 Unet（分割任务）与 LSTR（检测任务）的核心指标，同时补充传统算法（如 Canny 边缘检测 + 霍夫变换）作为基线：

**4.4.1 评价指标定义**

1. **平均推理用时（单位：s）**：衡量模型推理过程的效率，指模型完成单次任务推理所需的平均时间，数值越小表示模型运行速度越快，实时响应能力越强。
2. **权重文件大小（单位：MB）**：反映模型的存储开销，指模型训练完成后保存的权重参数文件占用空间，数值越小表示模型部署时的存储需求越低，适配性更强。
3. **准确率（单位：%）**：衡量模型的核心性能，指模型对任务的预测结果与真实结果的匹配程度，数值越高表示模型的预测效果越好。
    - 1. **对比结果**

表 11 对比结果

|   |   |   |   |
|---|---|---|---|
|**神经网络优化对比**|**优化前**|**优化后**|**优化比**|
|Unet平均用时（s）|**17.386s**|**4.676s**|**371.8%**|
|LSTR平均用时（s）|**1.953s**|**0.182s**|**1035.8.8%**|
|LSTR权重文件大小（MB）|**124.7MB**|**12MB**|**1039.1%**|
|Unet准确率|**93.1%**|**84.5%**|**-9.2%**|
|LSTR准确率|**97.4%**|**90.7%**|**-6.9%**|

**4.4.3 结果分析**

**1.效率优化：**Unet模型的平均推理用时从17.386s缩减至4.676s，优化比为371.8%，推理速度提升近3.7倍，有效改善了原模型推理耗时较长的问题，使模型推理流程更适配工程应用中的效率需求，任务处理吞吐量得到明显提高；LSTR模型的推理速度优化效果更为显著，其平均推理用时从1.953s压缩至0.182s，优化比为1035.8%，加速比达10.36。参考行业内实时推理场景通常要求加速比≥10的技术指标，该模型已能够满足高实时性响应需求，其推理速度表现为工程落地提供了适配性支持，可应用于智能检测、实时决策等对响应速度有明确要求的场景。

**2.存储优化：**模型存储优化方面，权重文件大小从优化前的124.7MB压缩至12MB，优化比为1039.1%，存储开销降低约90.3%。轻量化处理后，模型的存储资源占用显著减少，不仅降低了部署过程中的存储成本，还提升了对存储资源有限环境的适配能力，可更好地应用于嵌入式设备、移动端等边缘场景，一定程度上拓宽了模型的部署范围与实际应用场景。

**3.性能权衡：**经测试，两款模型优化后准确率均存在小幅下降，且损失幅度处于可控范围，未对模型核心功能的正常发挥造成影响：Unet模型准确率从优化前的93.1%降至84.5%，损失9.2%；LSTR模型准确率从97.4%降至90.7%，损失6.9%。优化后的准确率水平仍能满足多数常规应用场景的性能要求。

**4.4.4 实际效果分析**

选取几张车道线图片分别使用Unet和LSTR进行识别，识别效果如图 39~图 41所示。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2038.png>)![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2015.jpeg>)

图 39 测试效果对比（一）

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2039.png>)![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2040.png>)

图 40 测试效果对比（二）

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2041.png>)![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2042.png>)

图 41 测试效果对比（三）

从图 39、图 40以及图 41可以看出，Unet识别车道线的范围更广，包括了装载车辆本身车道以及旁边的车道，但是对车道线识别的准确率更低，尤其在靠近摄像头的部分容易漏检；LSTR则拥有更高的识别精度，可以准确地覆盖当前所行驶的车道区域，但是对于旁边的车道敏感度大幅降低。此外，对于道路前方有车辆遮挡的情况，Unet可以更准确地分辨出障碍物并过滤掉特征点，而LSTR的处理相对糟糕，遇到车辆遮挡识别准确率大幅降低，直接偏离了车道轨迹。

综上所述，LSTR更适用于单向或双向行驶道路上车道线的识别，在高速路、山路等较狭窄，车辆密度相对稀疏的场景下准确率较高；Unet则更适用于市区内车流量大以及道路分支复杂的场景。在落地部署方面，输入256*256的图像，LSTR拥有更快的识别速度，可以达到7～10帧，Unet的识别速度稍慢，只有4～5帧。

- 1. **重难点分析​**

1. **模型部署流程**

分为PC端侧训练+边缘端侧部署，熟悉模型转化流程

1. **神经网络基础知识：**

模型架构、卷积、池化、损失函数、前向传播和反向传播、语义分割相关知识。

这里分享两个学习网站供大家学习：

**深度学习基础：**[https://www.bilibili.com/video/BV1s1sozLEFq/?spm_id_from=333.1387.homepage.video_card.click&vd_source=a94746b8c7cd031dfff3d0954a6a7e34](https://www.bilibili.com/video/BV1s1sozLEFq/?spm_id_from=333.1387.homepage.video_card.click&vd_source=a94746b8c7cd031dfff3d0954a6a7e34)

**语义分割基础：**

[https://www.bilibili.com/video/BV1QooHYYE47/?spm_id_from=333.337.search-card.all.click&vd_source=a94746b8c7cd031dfff3d0954a6a7e34](https://www.bilibili.com/video/BV1QooHYYE47/?spm_id_from=333.337.search-card.all.click&vd_source=a94746b8c7cd031dfff3d0954a6a7e34)

1. **学习两个模型结构，分析为什么要使用这两个模型作对比**

前者依托Unet经典的编码-解码+跳跃连接结构，天然适配车道线像素级语义分割任务，能精准捕捉车道线边缘、连续型特征；后者则借助transformer注意力机制的全局特征建模能力，弥补Unet在复杂场景（弯道、遮挡、多车道、光影干扰）下易丢失全局上下文的短板，提升极端场景下车道线识别鲁棒性。

1. **优化方法是什么，以及为什么要使用这种轻量化方法**

深度可分离卷积+量化，熟悉两个方法使用过程。

为什么用这种轻量化方法——简单，对新入门深度学习的小白较友好，易上手且满足项目指标。

1. **模型优化前后实验对比效果：分为速度和精度两方面掌握**
    - 1. **难点分析**

更多是对模型的学习和掌握，以及整套流程的落地

1. **QT上位机设计**

QT这部分可以简单看看视频，看是如何应用的，面试会有极少数问QT，槽

- 1. **上位机功能介绍**

本项目的上位机基于QT5.12.8 开发，主要有以下特点：

1. 实时控制摄像头以不低于25帧的速率采集图片并显示在画面中；
2. 实时将摄像头采集的图片按时间先后进行数字编号并保存；
3. 利用集成了LIME低照度增强处理的卷积神经网络实时对车道线画面进行识别，并在上位机界面实时显示后台终端进程；
4. 实时检测并显示飞腾开发板多核 CPU 的平均 CPU 占用率与内存，相比麒麟系统自带的CPU监控器更直观的显示程序运行时CPU和内存的占用率的变化。

上位机界面如图6-1所示。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2043.png>)

图 42 上位机界面

如图 42所示，左上角是本地视频显示窗口，上中是车道线识别画面窗口，左下方是摄像头实时画面窗口，下中是车道线识别程序后台终端界面，右上角是系统硬件监视器，右下角是识别完成保存的图片所在文件夹列表。

点击左上角“摄像头”按钮，将弹出一个列表，包含“open/stop”选项，分别控制打开和关闭摄像头；点击“视频文件”按钮，将弹出文件夹界面，供用户选择需要播放的视频文件，确定播放后在后台自动采集视频中的画面帧并保存在项目的子目录下；点击“车道线识别”按钮，将触发卷积神经网络识别程序对保存的图片进行读取、识别，识别的速度会在识别画面下方的终端界面实时显示，同时旁边存放识别结果的文件列表也会实时更新。

- 1. **上位机程序设计**

**5.2.1 上位机调用外部可执行程序**

对于比较耗时的操作，比如预处理以及卷积神经网络识别，如果放在上位机主程序里常常会导致程序堵塞，因此，本项目采用Qt 中的QProcess 类调用外部可执行程序，这样就相当于使用操作系统的多线程来实现多任务流转，而 QT 主程序只起到启动外部脚本、输入命令、读回参数的功能。

**5.2.2 CPU和内存的监控**

麒麟操作系统自带的系统监视器可以显示每个CPU核的占用率，为了更好地监控上位机运行期间系统硬件的使用情况，将多个 CPU 的平均负载作为我们的监控标准较为合适。因此，本设计利用 QChart 自制了一款针对麒麟系统 CPU 和内存占用的实时监控系统，可以在上位机当中直观地评估当前系统的运行状况。

在银河麒麟系统下，通过命令 cat /proc/stat 可以查看从系统运行到目前位置的系统滴答时间，如图 43所示。

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2016.jpeg>)

图 43 系统/proc/stat 文件内容

文件每一列的内容含义如图 44所示：

![Linux视觉感知处理原作者文档](<projects/linux视觉感知项目/Attachments/Linux视觉感知处理原作者文档%2044.png>)

图 44 系统CPU指标含义

图 44中每一列的时间是累加的，因此可以在一段时间的开始和结尾读取文件数据，相减得到各项时间指标，并使用式（6-1）计算CPU占用率：

(6-1)

其中时间间隔统一为1s，根据式（6-1）在上位机实现对应代码如下：

**double** sysinfolinuximpl::cpuLoadAverage()  

{  

    QProcess process;  

    process.start("cat /proc/stat");  

    process.waitForFinished();  

    QString str = process.readLine();  

    str.replace("\n","");  

    str.replace(QRegExp("( ){1,}")," ");  

    auto lst = str.split(" ");  

    **if**(lst.size() > 3)  

    {  

        **double** use = lst[1].toDouble() + lst[2].toDouble() + lst[3].toDouble();  

        **double** total = 0;  

        **for**(**int** i = 1;i < lst.size();++i)  

            total += lst[i].toDouble();  

        **if**(total - pre_total > 0)  

        {  

            cpu_rate =(use - pre_user) / (total - pre_total) * 100.0;  

            pre_total = total;  

            pre_user = use;  

        }  

    }  

    **return** cpu_rate;  

} 

通过 QChart 可以将得到的点连成曲线显示在表格中，为了实现动态效果，定义一个 QList 容器， 限制其最多装 50 个 double 类型的数， 使用定时器每隔1s在容器最后增加一个新的点并删除第一个点，在图表上每隔 1s 刷新一次，使之看起来拥有动态效果。代码如下：

/*此函数刷新QChart图表CPU数据*/  

**void** MainWindow::receivedData_cpu(**double** value)  

 {  

     /* 将数据添加到 data 中 */  

     data_cpu.append(value);  

     /* 当储存数据的个数大于最大值时，把第一个数据删除 */  

     **while** (data_cpu.size() > maxSize) {  

     /* 移除 data 中第一个数据 */  

     data_cpu.removeFirst();  

     }  

     /* 先清空 */  

     series_cpu->clear();  

     /* 计算 x 轴上的点与点之间显示的间距 */  

     **int** xSpace = maxX / (maxSize - 1);  

     /* 添加点，xSpace * i 表示第 i 个点的 x 轴的位置 */  

     **for** (**int** i = 0; i < data_cpu.size(); ++i) {  

     series_cpu->append(xSpace * i, data_cpu.at(i));  

 }  

}