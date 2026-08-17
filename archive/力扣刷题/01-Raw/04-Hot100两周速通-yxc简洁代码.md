---
title: Hot100两周速通-yxc简洁代码
tags:
  - tech
  - algorithm
  - leetcode
  - reference
created: 2026-07-15
type: permanent
summary: 按 Hot100 两周速通刷题计划整理的题面、思路、双站链接和 AcWing yxc C++ 简洁代码
---

# Hot100 两周速通：yxc 简洁代码

> 来源：AcWing「LeetCode 究极班」相关代码中的 yxc 代码。
>
> 题目顺序来自 [[02-Hot100两周速通刷题计划]]，按 Day 1–Day 14 重排。
>
> 说明：每道题都包含简洁题面、思路理解、解题步骤、复杂度参考和易错点，并附 LeetCode 题目、AcWing 题目、AcWing yxc 代码及完整题解链接。本文件中的 YXC 代码是本项目唯一最终提交版。




## Day 1：哈希 + 双指针

### 1. 两数之和（LeetCode 1 · Easy）

#### 题目

给定一个整数数组 `nums` 和一个整数目标值 `target`，请在该数组中找出和为目标值的两个整数，并返回它们的数组下标。

你可以假设每种输入只会对应一个答案，且数组中同一个元素不能使用两遍。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/two-sum/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2326/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/339799/)
- 题目详解：[[1-两数之和|打开完整题解]]

#### 解题思路

核心洞察：**不需要把所有元素先存进去再查，可以边遍历边查找。**

遍历到元素 num 时，检查 complement = target - num 是否已经出现在哈希表中：
- 如果出现过，说明之前遍历过的某个元素和当前元素正好凑成 target，直接返回。
- 如果没出现过，把当前元素存入哈希表，供后面的元素查。

这样做的好处是：一次遍历完成，且天然不会出现同一元素用两次的情况（因为当前元素还没存进哈希表）。

#### 易错点
- **重复元素混淆：** `nums = [3, 3], target = 6` 这类输入，两遍哈希需要额外检查 `mapping[complement] != i` 排除自身；一遍哈希查询时当前元素尚未入表，天然不会把同一元素用两次。
- **负数处理：** target 可能是负数，complement = target - num 可能大于 num，不要假设 complement 一定比 num 小。
- **提前返回：** 找到解后立即 return，不要继续循环，否则可能覆盖结果。
- **哈希表覆盖：** 两遍哈希中重复元素的下标会互相覆盖，必须配合自身检查才安全；一遍哈希边查边存，查询发生在写入之前，不受覆盖影响。

#### YXC 最终代码
```cpp
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> heap;                            // 哈希表，O(1)查找
        for (int i = 0; i < nums.size(); i ++ ) {                // 遍历
            int r = target - nums[i];
            if (heap.count(r)) return {heap[r], i};              // 查找是否在哈希表中
            heap[nums[i]] = i;
        }

        return {};
    }
};
```


### 2. 字母异位词分组（LeetCode 49 · Medium）

#### 题目

给你一个字符串数组，请你将字母异位词组合在一起。字母异位词指字母相同但排列不同的字符串。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/group-anagrams/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2386/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/356303/)
- 题目详解：[[49-字母异位词分组|打开完整题解]]

#### 解题思路

**核心想法：** 互为字母异位词的两个字符串，排序后的结果完全相同。

**为什么这样想：** 字母异位词的本质是"字符的多重集相同"。排序后，多重集变成了确定的字符串，可以作为哈希表的 key。

遍历每个字符串，将其排序后的结果作为 key，原字符串追加到对应的列表中。

**时间复杂度：** O(n × k log k)，其中 n 是字符串数量，k 是字符串最大长度
**空间复杂度：** O(n × k)

#### 易错点
- **哈希 key 必须可哈希：** 排序后的 `string` 可直接作为 key；若用 `array<int, 26>` 计数，需要自定义哈希或编码成字符串。
- **计数数组维度：** 题目限定小写字母，数组长度是 26。如果字符集扩展（如包含大写字母），数组长度需要调整。
- **空字符串处理：** 空字符串 `""` 排序后还是 `""`，计数数组全为 0，这两种方法都能正确处理空串。
- **性能选择：** 排序法在 k 较小（k <= 100）时非常高效且代码简洁，是面试中最推荐的方法。计数法和质数法虽然理论更优，但实际差异不大。
- **质数溢出：** 质数乘积增长极快，k=100 时乘积远超 `long long` 上限，在 C++ 中必然溢出（只有 Python 的任意精度整数才能这么写），所以 C++ 里排序键和计数数组才是可靠选择。

#### YXC 最终代码
```cpp
class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string, vector<string>> hash;              // 哈希表，O(1)查找
        for (auto& str: strs) {
            string nstr = str;
            sort(nstr.begin(), nstr.end());                      // 排序
            hash[nstr].push_back(str);
        }

        vector<vector<string>> res;
        for (auto& item : hash) res.push_back(item.second);      // 记录结果

        return res;
    }
};
```


### 3. 最长连续序列（LeetCode 128 · Medium）

#### 题目

给定一个未排序的整数数组 `nums`，找出数字连续的最长序列的长度。要求时间复杂度 O(n)。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/longest-consecutive-sequence/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2490/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/394597/)
- 题目详解：[[128-最长连续序列|打开完整题解]]

#### 解题思路

**关键洞察：** 如果不做优化，对每个元素都往后查找连续序列，最坏情况 O(n^2)。例如 `[1, 2, 3, 4, 5]`——每个元素都会往后找一遍。

**核心优化：只从序列的起点开始查找。** 如何判断一个数字是起点？检查 `num - 1` 是否在集合中。如果不在，说明 `num` 是一个连续序列的第一个元素；如果在，说明 `num` 不是起点，跳过它。

这个优化的美妙之处在于：每个元素最多被"往后延伸"一次（只有当它是起点时），总体 O(n)。

#### 易错点
- **重复元素：** `nums = [0, 0, 1, 2]`，最长的连续序列是 [0, 1, 2] 长度 3，不是 4。必须用 set 去重，否则重复的 0 会被多算。
- **空数组：** `nums.empty()` 时直接返回 0；用 `unordered_set` 的写法即使不特判也会自然返回 0。
- **遍历方式与去重：** 代码直接遍历原数组 `nums`，配合 `S.count(x)` 判断该数是否仍在集合中；起点延伸时会把统计过的数 `S.erase` 掉，重复元素第二次出现时 `S.count(x)` 为假，自动跳过，效果等价于遍历去重集合。
- **负数处理：** `!S.count(x - 1)` 的起点判断对负数同样有效，不需要特殊处理。
- **溢出不需担心：** 本题数据范围 ±10^9 在 `int` 范围内，不会溢出。

#### YXC 最终代码
```cpp
class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        unordered_set<int> S;                                    // 哈希集合，去重+O(1)查找
        for (auto x: nums) S.insert(x);

        int res = 0;
        for (auto x: nums) {
            if (S.count(x) && !S.count(x - 1)) {
                int y = x;
                S.erase(x);
                while (S.count(y + 1)) {                         // 向后延伸连续序列
                    y ++ ;
                    S.erase(y);
                }
                res = max(res, y - x + 1);
            }
        }

        return res;
    }
};
```


### 4. 移动零（LeetCode 283 · Easy）

#### 题目

给定一个数组 `nums`，编写一个函数将所有 0 移动到数组的末尾，同时保持非零元素的相对顺序。要求原地操作。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/move-zeroes/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2663/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/456460/)
- 题目详解：[[283-移动零|打开完整题解]]

#### 解题思路

**核心想法：** 用两个指针（slow 和 fast）协同完成一次遍历中的"筛选+重排"。

**关键洞察：**
- `slow` 指针指向"下一个非零元素应该被放置的位置"。
- `fast` 指针在前面探路，寻找非零元素。
- 当 `fast` 找到非零元素时，将其与 `slow` 位置的元素交换，然后 `slow++`。

这样就等价于：非零元素被"交换"到前面，零被"交换"到后面。且因为 `slow` 始终指向第一个可能为 0 的位置，所有非零元素的相对顺序保持不变。

#### 易错点
- **交换 vs 赋值：** 快慢指针交换法中，`nums[slow]` 和 `nums[fast]` 交换，不要写成赋值。如果直接赋值不交换，会导致非零元素被覆盖丢失。
- **slow 没有重置：** slow 从 0 开始，只增不减。不要在循环内重置。
- **全非零数组的优化：** 如果数组没有 0，方法一的每次 `swap` 是自身交换（浪费性能但结果正确），方法三通过 `if i != j` 避免了自身赋值。
- **保持顺序：** 不能用从两端往中间靠拢的双指针（如快速排序 partition 的交换方式），那样会打乱非零元素的相对顺序。
- **元素不只有 0 和非零：** 数值包含负数，但题目只关心是否为 0，负数也属于"非零"，要保留前面的相对顺序。

#### YXC 最终代码
```cpp
class Solution {
public:
    void moveZeroes(vector<int>& nums) {
        int k = 0;
        for (auto x: nums)
            if (x)
                nums[k ++ ] = x;
        while (k < nums.size()) nums[k ++ ] = 0;
    }
};
```


### 5. 盛最多水的容器（LeetCode 11 · Medium）

#### 题目

给定一个长度为 n 的整数数组 `height`，有 n 条垂线，找出其中的两条线，使得它们与 x 轴共同构成的容器可以容纳最多的水。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/container-with-most-water/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2344/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/346694/)
- 题目详解：[[11-盛最多水的容器|打开完整题解]]

#### 解题思路

**关键洞察：** 面积取决于两个因素：宽度和较矮柱子的高度。当两个指针从两端向中间移动时，宽度在持续减小。想要面积变大，唯一的可能是高度增加。

**核心推理：**
- 假设 `height[left] < height[right]`（左边较矮）。
- 如果移动 `right`（较高的），新面积 = `(right - left - 1) × min(height[left], height[right-1])`。
  - 宽度减小了 1。
  - 由于 `height[left]` 没变，而右边高度无论怎么变，`min` 的值 ≤ `height[left]`。
  - 所以新面积 ≤ 旧面积 → **移动较高的指针，面积不可能变大**。
- 如果移动 `left`（较矮的），虽然宽度也减小了，但新的 `height[left+1]` 可能比原来的 `height[left]` 高，`min` 值有可能变大。

因此，每次都移动较矮的那根柱子是唯一可能增加面积的策略。

#### 易错点
- **移动策略搞反：** 最容易犯的错误是"移动较高的指针"，这会导致错过最优解。关键推理：移动较高的指针面积不可能变大，所以永远只移动较矮的。
- **高度相等时：** `height[left] == height[right]` 时，移动任意一边都可以。因为两边一样高，无论移动哪边，高度都不可能超过当前值（因为 min 值已经是当前高度了）。习惯上移动 `left` 或 `right` 都可以。
- **面积计算公式：** 面积 = `(right - left) * min(height[left], height[right])`，不是 `max`，也不是 `(right - left + 1)`。
- **指针移动方向：** 从两端向中间移动（对撞指针），不是同向移动（快慢指针）。这是双指针的两种不同模式。
- **更新最大值的位置：** 每次移动指针**之前**（或之后立即）计算面积并更新最大值，不要只在移动后才计算。

#### YXC 最终代码
```cpp
class Solution {
public:
    int maxArea(vector<int>& height) {
        int res = 0;
        for (int i = 0, j = height.size() - 1; i < j;) {
            res = max(res, min(height[i], height[j]) * (j - i));
            if (height[i] > height[j]) j -- ;
            else i ++ ;  // 当前值太小，排除当前行
        }
        return res;
    }
};
```


### 6. 三数之和（LeetCode 15 · Medium）

#### 题目

给你一个整数数组 `nums`，判断是否存在三元组 `[nums[i], nums[j], nums[k]]` 满足 `nums[i] + nums[j] + nums[k] == 0`。请你返回所有和为 0 且不重复的三元组。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/3sum/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2348/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/346791/)
- 题目详解：[[15-三数之和|打开完整题解]]

#### 解题思路

**核心想法：** 排序后，固定一个数 `nums[i]`，在 `[i+1, n-1]` 区间内用对撞指针找两数之和为 `-nums[i]`。

**关键洞察：** 排序带来了三个好处：
1. 双指针可以 O(n) 找两数之和（有序数组两数之和的标准解法）。
2. 去重变得简单——相邻重复元素可以直接跳过。
3. 可以剪枝——`nums[i] > 0` 时直接结束。

**去重策略（三个层面）：**
- 外层 `i`：如果 `nums[i] == nums[i-1]`，跳过（避免同一值当固定元素多次）。
- 内层 `left`：找到答案后，跳过 `nums[left] == nums[left-1]`。
- 内层 `right`：找到答案后，跳过 `nums[right] == nums[right+1]`。

#### 易错点
- **去重时机：** 外层去重要在**进入循环时**判断（`if i > 0 and nums[i] == nums[i-1]: continue`），而不是找到答案后再去重。内层去重要在**找到答案后**进行。
- **去重遗漏：** 如果只在外层去重，内层可能产生重复。比如 `nums = [-2, 0, 0, 2, 2]`，固定 -2 后，left=0, right=2 得到 [-2, 0, 2]，left=0, right=2（另一个 2）又会得到同样的 [-2, 0, 2]。所以内层也要去重。
- **剪枝条件：** 是 `nums[i] > 0` 而不是 `nums[i] >= 0`。因为 `nums[i]` 可以为 0（如 `[0, 0, 0]`）。如果写 `>=`，会漏掉全 0 的情况。
- **指针初始化：** `left = i + 1`，不是 `left = 0`。如果 left 从 0 开始，可能会和 `nums[i]` 重复使用同一个元素。
- **边界检查：** 内层去重的 while 循环需要判断 `left < right`，防止越界。
- **别忘了先排序：** 如果忘记了排序步骤，双指针无法正常工作（无序数组的双指针无法保证正确性）。

#### YXC 最终代码
```cpp
class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        vector<vector<int>> res;
        sort(nums.begin(), nums.end());                          // 排序
        for (int i = 0; i < nums.size(); i ++ ) {                // 遍历
            if (i && nums[i] == nums[i - 1]) continue;
            for (int j = i + 1, k = nums.size() - 1; j < k; j ++ ) {
                if (j > i + 1 && nums[j] == nums[j - 1]) continue;
                while (j < k - 1 && nums[i] + nums[j] + nums[k - 1] >= 0) k -- ;  // 移动k使三数和 ≥ 0的最右位置
                if (nums[i] + nums[j] + nums[k] == 0) {
                    res.push_back({nums[i], nums[j], nums[k]});  // 记录结果
                }
            }
        }

        return res;
    }
};
```


### 7. 接雨水（LeetCode 42 · Hard）

#### 题目

给定 n 个非负整数表示每个宽度为 1 的柱子的高度图，计算按此排列的柱子，下雨之后能接多少雨水。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/trapping-rain-water/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2379/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/356196/)
- 题目详解：[[42-接雨水|打开完整题解]]

#### 解题思路

**关键洞察：** 按行（高度层）计算水量。单调栈维护一个单调递减的栈（栈底到栈顶高度递减），栈中存柱子的索引。当遇到一个比栈顶高的柱子时，栈顶柱子就形成了一个"凹槽"的底部，弹栈并计算当前高度层的水量。同一根柱子可能被多个高度层分别计算。

**核心推理（单调栈版）：**
- 遍历每个柱子 `height[i]`，用 `last` 记录上一个被弹出柱子的高度（初始为 0）。
- 当栈非空且 `height[i] >= height[stk.top()]` 时，说明栈顶柱子遇到了右边第一个不比它矮的柱子，弹栈计算水量：
  - 当前层的雨水面积 = `(height[stk.top()] - last) × (i - stk.top() - 1)`
  - 累加后更新 `last = height[stk.top()]`，继续弹栈。
- 弹栈结束后，如果栈不为空，说明栈顶柱子比当前柱子高，但两者之间还有空间可以存水：
  - 剩余水量 = `(i - stk.top() - 1) × (height[i] - last)`
- 将当前索引 `i` 入栈。

**为什么用单调栈？** 单调栈天然适合处理"找左右两边第一个更高/更矮"的问题。接雨水就是在找到右边第一个不低于当前柱子的位置时，计算中间形成的凹槽水量，按行（高度层）累加。

**复杂度：** 时间 O(n)，空间 O(n)

#### 易错点
- **`last` 变量的作用：** `last` 记录上一个被弹出柱子的高度，用于计算同一层不同宽度段的水量。同一根柱子可能在多个高度层被分别计算。
- **单调栈的边界处理：** 弹栈后如果 stack 为空，说明左侧没有更高的柱子，无法形成凹槽，跳过剩余部分计算。
- **单调栈的水量公式：** 弹栈时为 `(height[stk.top()] - last) × (i - stk.top() - 1)`；弹栈结束后为 `(i - stk.top() - 1) × (height[i] - last)`。
- **栈中存索引而非值：** 计算宽度时必须用索引差，所以栈中必须存索引。
- **小于 3 根柱子：** 如果柱子数少于 3，无法形成凹槽，直接返回 0。

#### YXC 最终代码
```cpp
class Solution {
public:
    int trap(vector<int>& height) {
        stack<int> stk;
        int res = 0;
        for (int i = 0; i < height.size(); i ++ ) {
            int last = 0;
            while (stk.size() && height[stk.top()] <= height[i]) { // 维护单调栈
                res += (height[stk.top()] - last) * (i - stk.top() - 1);  // 计算当前高度层的雨水面积
                last = height[stk.top()];
                stk.pop();                                       // 出栈
            }

            if (stk.size()) res += (i - stk.top() - 1) * (height[i] - last);  // 处理栈顶剩余部分
            stk.push(i);                                         // 入栈
        }

        return res;
    }
};
```




## Day 2：滑动窗口 + 子串

### 1. 无重复字符的最长子串（LeetCode 3 · Medium）

#### 题目

给定一个字符串 `s`，请你找出其中不含有重复字符的最长子串的长度。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/longest-substring-without-repeating-characters/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2328/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/339855/)
- 题目详解：[[3-无重复字符的最长子串|打开完整题解]]

#### 解题思路

**核心想法：** 用哈希集合 `char_set` 存储当前窗口内的字符。右指针扩展窗口，如果遇到重复字符，左指针收缩直到窗口内无重复。

**三问法分析：**
1. **什么时候扩大？** 右指针字符加入后无重复 → 右移 right。
2. **什么时候缩小？** 出现重复字符 → 左移 left 直到无重复。
3. **什么时候更新答案？** 扩大窗口后（窗口变大，可能产生更优解）。

#### 易错点
- **子串 vs 子序列：** 子串必须连续，不重复子序列可以跳过中间字符。题目要求的是子串，所以用滑动窗口。如果搞成子序列，就变成完全不同的题了。
- **字典版中 left 不能回退：** 需要检查 `char_index[ch] >= left`，因为 `char_index` 中可能记录了该字符但不在当前窗口中（已经被 left 越过了）。如果不加这个判断，left 可能错误地"回退"到更早的位置。
- **字符集大小：** 题目中字符集是 ASCII，不是仅限小写字母。如果用固定数组，需要 128 或 256 大小，不能只开 26。
- **空字符串处理：** s 可能为空，此时 max_len 保持为 0，直接返回 0。
- **更新答案的时机：** 是在窗口扩大后（right 移动后）更新，不是在窗口收缩时。对集合版来说，while 移除重复后立即更新。对字典版来说，跳跃 left 后立即更新。

#### YXC 最终代码
```cpp
class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> heap;                           // 哈希表，O(1)查找
        int res = 0;
        for (int i = 0, j = 0; i < s.size(); i ++ ) {
            heap[s[i]] ++ ;
            while (heap[s[i]] > 1) heap[s[j ++ ]] -- ;
            res = max(res, i - j + 1);
        }
        return res;
    }
};
```


### 2. 找到字符串中所有字母异位词（LeetCode 438 · Medium）

#### 题目

给定两个字符串 `s` 和 `p`，找到 `s` 中所有 `p` 的异位词子串，返回这些子串的起始索引。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/find-all-anagrams-in-a-string/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2860/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/541455/)
- 题目详解：[[438-找到字符串中所有字母异位词|打开完整题解]]

#### 解题思路

**核心想法：** 初始化 `cnt_p` 统计 p 中每个字母出现次数。用同样大小的 `cnt_s` 统计 s 中当前窗口内的字母，窗口长度固定为 `len(p)`。每次窗口整体右移一步，更新 `cnt_s`（新字符 +1，离开的字符 -1），然后比较两个数组是否相等。

**关键洞察：** 固定长度窗口的"滑动"意味着每次左指针和右指针各移动一次，窗口大小不变。这比不定长窗口简单——不需要 while 循环来调整大小。

#### 易错点
- **p 比 s 长：** 直接返回空列表，否则后续的 `s[i - len(p)]` 会取到负索引（在 C++ 中会从末尾取，导致错误结果）。一定要先检查。
- **计数数组索引计算：** `ord(ch) - 97`（或 `ord(ch) - ord('a')`），不是 `ord(ch)` 本身，也不是 `ord(ch) - 96`（'a' 的 ASCII 码是 97）。
- **窗口形成判断：** `if i >= len(p)` 表示当索引 i 超过等于 p 长度时，窗口已满，需要移除左边界元素。注意是 `>=` 不是 `>`。
- **结果索引计算：** `i - len(p) + 1`，不是 `i` 也不是 `i + 1`。例如 p 长度为 2，当 i=1 时窗口为 [0,1]，起始索引是 0 = 1 - 2 + 1。
- **C++ 列表比较：** `cnt_s == cnt_p` 在 C++ 中是逐个元素比较，虽然简洁但每次 O(26)。由于 26 很小，这个开销可以忽略，但如果字符集很大（如 256），就不建议直接用 == 了。
- **p 中可能有重复字符：** 计数数组需要正确统计每个字符的出现次数，`p = "aab"` 意味着需要 2 个 a 和 1 个 b。

#### YXC 最终代码
```cpp
class Solution {
public:
    vector<int> findAnagrams(string s, string p) {
        unordered_map<char, int> cnt;                            // 哈希表，O(1)查找
        for (auto c: p) cnt[c] ++ ;
        vector<int> res;
        int tot = cnt.size();
        for (int i = 0, j = 0, satisfy = 0; i < s.size(); i ++ ) {
            if ( -- cnt[s[i]] == 0) satisfy ++ ;
            while (i - j + 1 > p.size()) {
                if (cnt[s[j]] == 0) satisfy -- ;
                cnt[s[j ++ ]] ++ ;
            }
            if (satisfy == tot) res.push_back(j);                // 记录结果
        }
        return res;
    }
};
```


### 3. 和为 K 的子数组（LeetCode 560 · Medium）

#### 题目

给你一个整数数组 `nums` 和一个整数 `k`，请你统计并返回该数组中和为 `k` 的连续子数组的个数。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/subarray-sum-equals-k/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/3051/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/602984/)
- 题目详解：[[560-和为K的子数组|打开完整题解]]

#### 解题思路

**核心洞察：** 子数组 `nums[j..i]` 的和 = `prefix[i] - prefix[j-1]`。要求这个和等于 k，即 `prefix[j-1] = prefix[i] - k`。所以当我们在位置 i 时，只需要知道有多少个前缀和等于 `prefix[i] - k`。

**为什么用哈希表：** 我们需要快速查询某个前缀和的出现次数，哈希表 O(1) 查询正合适。

**为什么初始化 `{0: 1}`：** 前缀和为 0 对应「空数组」。如果一个子数组从头开始（索引 0 到 i）的和就是 k，那么我们需要 `prefix[-1] = 0` 来匹配，所以初始化 0 出现 1 次。

**复杂度：** O(n) 时间，O(n) 空间。

#### 易错点
- **初始化 `{0: 1}` 遗漏**：忘记初始化会导致从开头到某位置的子数组（和为 k）被漏统计。
- **更新顺序**：必须先查 `cur_sum - k`，再将当前 `cur_sum` 存入哈希表。如果先存再查，当 k=0 时每个位置都会把自己算进去（把空子数组也算上了）。
- **负数处理**：因为有负数，前缀和可能重复出现多次，哈希表要记录次数（计数累加），而不是简单用集合。
- **整型溢出**：C++ 不用担心，但其他语言需要考虑前缀和是否超过 int 范围。
- **连续子数组 vs 子序列**：题目要求连续，不要用子序列的思路去解。

#### YXC 最终代码
```cpp
class Solution {
public:
    int subarraySum(vector<int>& nums, int k) {
        int n = nums.size();
        vector<int> s(n + 1);
        for (int i = 1; i <= n; i ++ ) s[i] = s[i - 1] + nums[i - 1];
        unordered_map<int, int> hash;                            // 哈希表，O(1)查找
        hash[0] = 1;
        int res = 0;
        for (int i = 1; i <= n; i ++ ) {
            res += hash[s[i] - k];
            hash[s[i]] ++ ;
        }
        return res;
    }
};
```


### 4. 滑动窗口最大值（LeetCode 239 · Hard）

#### 题目

给你一个整数数组 `nums`，有一个大小为 `k` 的滑动窗口从数组的最左侧移动到最右侧。返回每个滑动窗口中的最大值。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/sliding-window-maximum/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2633/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/445221/)
- 题目详解：[[239-滑动窗口最大值|打开完整题解]]

#### 解题思路

**核心想法：** 维护一个双端队列 `q`，队列中存储元素的**索引**（不是值），且这些索引对应的值在队列中是**单调递减**的。

**为什么存储索引而不是值？** 因为我们需要判断队首元素是否已经滑出窗口——这需要通过索引与 `i - k + 1` 的关系来判断。

**关键洞察：** 当新元素 `nums[i]` 加入时，队列中所有比 `nums[i]` 小的元素都失去了成为最大值的可能（它们更早过期，更小），可以直接从队尾弹出。

**单调队列的维护三步走：**
1. **维护单调性**：从队尾弹出所有比 `nums[i]` 小的索引。
2. **入队**：将当前索引 `i` 加入队尾。
3. **移除过期**：如果队首索引 `q[0]` 已经不在窗口内（`q[0] <= i - k`），从队首弹出。
4. **记录结果**：当窗口形成（`i >= k - 1`）后，队首索引对应的值就是当前窗口最大值。

#### 易错点
- **存储索引而非值：** 队列中存储的必须是索引而不是值。因为我们需要判断过期——值无法告诉我们元素是否还在窗口内，只有索引可以。
- **单调性定义：** 是**单调递减**（从大到小），队首是最大值。不是单调递增。如果是递增，队首是最小值，不符合需求。
- **出队顺序：** 先弹出队尾小元素，再加入新元素，再弹出队首过期元素，最后取结果。顺序不要搞反。特别是，新加入的元素可能在下一步就变成过期的（虽然不可能，因为 i 刚被加入，i - k 至少比 i 小 k），但逻辑顺序仍然要正确。
- **过期判断条件：** `q[0] <= i - k`，不是 `q[0] < i - k + 1`。两者等价但前者更简洁。注意当 `q[0] == i - k` 时，它已经在窗口的左边界之外了（窗口是左闭右闭 `[i-k+1, i]`）。
- **窗口未形成时不记录：** `i >= k - 1` 时才记录结果。前 k-1 个元素还没构成完整的窗口。
- **空队列检查：** while 操作队列前需要检查是否为空。
- **C++ 的 `priority_queue` 默认是大根堆：** 需要小根堆时使用 `greater<T>`；本题的最优提交仍是单调队列。

#### YXC 最终代码
```cpp
class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        deque<int> q;
        vector<int> res;
        for (int i = 0; i < nums.size(); i ++ ) {                // 遍历
            if (q.size() && i - k + 1 > q.front()) q.pop_front();  // 出队
            while (q.size() && nums[i] >= nums[q.back()]) q.pop_back();  // 出队
            q.push_back(i);                                      // 入队
            if (i >= k - 1) res.push_back(nums[q.front()]);      // 记录结果
        }
        return res;
    }
};
```


### 5. 最小覆盖子串（LeetCode 76 · Hard）

#### 题目

给你一个字符串 `s` 和一个字符串 `t`。返回 `s` 中涵盖 `t` 所有字符的最小子串。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/minimum-window-substring/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2425/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/370411/)
- 题目详解：[[76-最小覆盖子串|打开完整题解]]

#### 解题思路

**核心想法：** 本题是滑动窗口的集大成者，需要处理"不定长"、"多条件计数"、"最优解搜索"三个难点。

**关键数据结构：**
- `need`：字典，记录 t 中每个字符的需求数量。
- `window`：字典，记录窗口内每个字符的出现数量。
- `valid`：整数，记录"已满足需求的字符种类数"。当 `valid == len(need)` 时，说明窗口已覆盖 t。

**三问法分析：**
1. **什么时候扩大窗口？** 还没覆盖 → 右移 right，扩大窗口。
2. **什么时候缩小窗口？** 已经覆盖了 → 左移 left，找更小的窗口。
3. **什么时候更新答案？** 缩小窗口时（因为缩小意味着找到了更小的覆盖子串）。

#### 易错点
- **valid 变量的含义：** `valid` 表示的是"已满足需求的字符种类数"，不是"窗口中字符总数"，也不是"已满足的字符个数"。当 `window[ch] == need[ch]` 时 `valid` 才加一，当 `window[ch] < need[ch]` 时才减一。
- **valid 加减的对称性：** 扩大窗口时，`window[ch]` 从 `need[ch] - 1` 变为 `need[ch]` 时 `valid += 1`。缩小窗口时，`window[ch]` 从 `need[ch]` 变为 `need[ch] - 1` 时 `valid -= 1`。这两个操作必须对称。
- **更新答案的位置：** 答案在**缩小窗口前**更新，因为此时窗口刚好覆盖 t 且可能最小。不要在缩小后更新（那时候已经不覆盖了）。
- **字符不在 t 中：** 不需要加入 window 字典（因为它不影响 valid），但加入也可以（反正不会达到 need），不影响结果但浪费空间。
- **检查是否找到结果：** 注意 `length` 的初始值应该是 `INT_MAX`（或 `len(s) + 1`），返回时检查 `length` 是否被更新过。不能用 `0` 或 `len(s)` 作为未找到的标志（因为可能真的有一个长度为 0 或 len(s) 的子串）。
- **t 中可能有重复字符：** `need` 字典记录的是每个字符的需求数量，不是种类数。`valid` 的最大值是 `len(need)`（不同种类数），不是 `len(t)`。

#### YXC 最终代码
```cpp
class Solution {
public:
    string minWindow(string s, string t) {
        unordered_map<char, int> hs, ht;                         // 哈希表，O(1)查找
        for (auto c: t) ht[c] ++ ;

        string res;
        int cnt = 0;
        for (int i = 0, j = 0; i < s.size(); i ++ ) {
            hs[s[i]] ++ ;
            if (hs[s[i]] <= ht[s[i]]) cnt ++ ;  // 当前字符满足需求时，有效计数+1

            while (hs[s[j]] > ht[s[j]]) hs[s[j ++ ]] -- ;  // 收缩左边界，移除多余字符
            if (cnt == t.size()) {  // 窗口已覆盖t，更新答案
                if (res.empty() || i - j + 1 < res.size())
                    res = s.substr(j, i - j + 1);
            }
        }

        return res;
    }
};
```


### 6. 最大子数组和（LeetCode 53 · Medium）

#### 题目

给你一个整数数组 `nums`，请你找出一个具有最大和的连续子数组，返回其最大和。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/maximum-subarray/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2398/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/362176/)
- 题目详解：[[53-最大子数组和|打开完整题解]]

#### 解题思路

**核心洞察：**

定义 `dp[i]` 为**以 `nums[i]` 结尾的最大子数组和**。那么对于 `nums[i]` 有两种选择：
1. 把它接在 `nums[i-1]` 的后面：`dp[i] = dp[i-1] + nums[i]`
2. 以它为新起点重新开始：`dp[i] = nums[i]`

取两者中较大的：`dp[i] = max(nums[i], dp[i-1] + nums[i])`

最终答案是所有 `dp[i]` 中的最大值。

**空间优化：** 因为 `dp[i]` 只依赖 `dp[i-1]`，所以只需要一个变量 `cur_sum` 来滚动更新。

**复杂度：** O(n) 时间，O(1) 空间。

#### 易错点
- **初始化问题**：`max_sum` 必须初始化为 `nums[0]` 而不是 0。如果全为负数但初始化为 0 会返回错误结果 0。
- **空数组返回**：题目说至少一个元素，但如果是空数组需要特殊处理。
- **重置时机**：贪心法中重置 `cur_sum = 0` 而不是重置为当前元素值——因为下一轮循环会先加上当前元素。
- **负数处理**：当累加和加上一个负数后虽然变小了但不一定需要重置（后面可能有更大的正数）。
- **连续要求**：记住是连续子数组，不是子序列。如果用排序就错了。

#### YXC 最终代码
```cpp
class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int res = INT_MIN;                                       // 初始化为最小可能值
        for (int i = 0, last = 0; i < nums.size(); i ++ ) {
            last = nums[i] + max(last, 0);
            res = max(res, last);
        }
        return res;
    }
};
```


### 7. 合并区间（LeetCode 56 · Medium）

#### 题目

以数组 `intervals` 表示若干个区间的集合，合并所有重叠的区间，并返回一个不重叠的区间数组。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/merge-intervals/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2401/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/362233/)
- 题目详解：[[56-合并区间|打开完整题解]]

#### 解题思路

**核心洞察：**

按起点排序后，**重叠的区间必然在排序后相邻**。这样只需要一次遍历，在遍历过程中维护一个"当前合并区间"：
- 如果新区间的起点 <= 当前合并区间的终点 → 重叠，合并（更新终点为两者终点的较大值）
- 否则 → 不重叠，将当前合并区间加入结果，开始新的合并区间

**代码实现技巧：** 利用 `merged[-1]` 表示结果数组中最后一个（即当前正在合并的）区间，可以让代码非常简洁。

**复杂度：** O(n log n) 时间（排序），O(n) 空间（结果数组）。排序是算法的主要瓶颈。

#### 易错点
- **忘记排序**：未排序直接扫描会导致合并错误，因为重叠的区间可能没有相邻。
- **等于号处理**：`interval[0] <= end` 包含等于情况，因为 `[1,4]` 和 `[4,5]` 端点相接也算重叠。
- **更新终点**：合并时要取 `max(end, interval[1])` 而不是直接用 `interval[1]`——因为新区间可能完全包含在当前合并区间内。
- **最后一个区间**：遍历结束后别忘了把最后一个合并区间加入结果。
- **空输入**：如果 `intervals` 为空，直接返回空列表。
- **排序稳定性**：按起点排序即可，起点相同时顺序不影响结果。

#### YXC 最终代码
```cpp
class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& a) {
        vector<vector<int>> res;
        if (a.empty()) return res;

        sort(a.begin(), a.end());                                // 排序
        int l = a[0][0], r = a[0][1];
        for (int i = 1; i < a.size(); i ++ ) {
            if (a[i][0] > r) {
                res.push_back({l, r});                           // 记录结果
                l = a[i][0], r = a[i][1];
            } else r = max(r, a[i][1]);
        }

        res.push_back({l, r});                                   // 记录结果
        return res;
    }
};
```




## Day 3：数组技巧 + 矩阵

### 1. 轮转数组（LeetCode 189 · Medium）

#### 题目

给定一个整数数组，将数组中的元素向右轮转 `k` 个位置，要求原地操作。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/rotate-array/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2563/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/421926/)
- 题目详解：[[189-轮转数组|打开完整题解]]

#### 解题思路

**核心洞察：**

向右轮转 k 位，相当于把数组后面的 k 个元素移到前面来。翻转操作可以帮助我们实现这个效果：

**为什么这样可行？** 整体翻转让原数组的后 k 个元素到了前面（但顺序是反的），然后再对两部分分别翻转恢复顺序。

**复杂度：** O(n) 时间，O(1) 空间。

#### 易错点
- **忘记取模**：`k %= n` 是最常见的遗漏步骤。当 k > n 时，直接使用 k 会导致数组越界或错误的移动。
- **三次翻转的顺序**：必须是「整体 → 前 k 个 → 后 n-k 个」这个顺序。反了或者顺序错了结果会不同。
- **k = 0 的情况**：取模后 k=0，不需要任何操作，直接返回。
- **n = 1 的情况**：无论 k 是多少，轮转后不变。
- **环状替换的起始位置**：如果 n 和 k 不互质，需要从多个起点开始循环，否则会漏掉元素。
- **原地要求**：不能直接 `nums = rotated_list` 这样赋值，这不会修改原数组（C++ 中只是局部变量重绑定）。要修改原数组内容必须用索引赋值。

#### YXC 最终代码
```cpp
class Solution {
public:
    void rotate(vector<int>& nums, int k) {
        int n = nums.size();
        k %= n;
        reverse(nums.begin(), nums.end());
        reverse(nums.begin(), nums.begin() + k);
        reverse(nums.begin() + k, nums.end());
    }
};
```


### 2. 除自身以外数组的乘积（LeetCode 238 · Medium）

#### 题目

给你一个整数数组 `nums`，返回数组 `answer`，其中 `answer[i]` 等于 `nums` 中除 `nums[i]` 之外其余各元素的乘积。要求不使用除法，O(n) 时间。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/product-of-array-except-self/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2632/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/445198/)
- 题目详解：[[238-除自身以外数组的乘积|打开完整题解]]

#### 解题思路

**核心洞察：**

`answer[i]` 可以拆解为两部分：`nums[0..i-1]` 的乘积 × `nums[i+1..n-1]` 的乘积。

用**两次遍历**：
1. 从左到右：用 `left_prod` 累乘，把每个位置左边的乘积存入结果数组
2. 从右到左：用 `right_prod` 累乘，乘到结果数组的对应位置上

这样结果数组直接用上了，不需要额外的左右乘积数组。

**复杂度：** O(n) 时间，O(1) 额外空间（输出数组不算）。

#### 易错点
- **初始化顺序**：在第一次遍历中，先赋值 `res[i] = left_prod`，再更新 `left_prod *= nums[i]`。如果搞反顺序，`res[i]` 会包含 `nums[i]` 本身。
- **第二次遍历方向**：必须从右向左遍历，否则后缀积无法正确累乘。
- **结果数组初始值**：初始化为 `[1] * n`，因为乘积的初始值是 1 而不是 0。
- **包含 0 的情况**：如果有 0，除法方案失效，但前缀积+后缀积不受影响。
- **空数组/单元素数组**：题目说长度至少为 2，所以不用处理。
- **乘积顺序理解**：`res[i]` 是**除了 nums[i] 之外**的乘积，不要搞反。

#### YXC 最终代码
```cpp
class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        int n = nums.size();
        vector<int> p(n, 1);
        for (int i = 1; i < n; i ++ ) p[i] = p[i - 1] * nums[i - 1];
        for (int i = n - 1, s = 1; i >= 0; i -- ) {
            p[i] *= s;
            s *= nums[i];
        }
        return p;
    }
};
```


### 3. 缺失的第一个正数（LeetCode 41 · Hard）

#### 题目

给你一个未排序的整数数组，请你找出其中没有出现的最小的正整数。要求时间复杂度 O(n) 且空间复杂度 O(1)。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/first-missing-positive/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2378/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/356160/)
- 题目详解：[[41-缺失的第一个正数|打开完整题解]]

#### 解题思路

**核心洞察：**

答案一定在 [1, n+1] 范围内。我们把数组当作哈希表：
- 值 1 应该放在索引 0
- 值 2 应该放在索引 1
- 值 x（在 [1, n] 内）应该放在索引 x-1

通过交换操作将每个数归位，然后扫描找到第一个位置不对的，就是缺失的最小正数。

**为什么用 while 而不是 if：** 交换后，当前位置来了一个新值，这个新值可能也需要归位。while 确保当前位置的值最终要么归位要么不需要归位（负数、0、或 > n）。

**复杂度：** O(n) 时间（每个元素最多被交换两次），O(1) 空间。

#### 易错点
- **使用 while 而非 if**：在交换过程中，当前索引位置获得了新值，必须继续处理直到该位置的值归位或不需要归位。用 if 会导致遗漏。
- **交换顺序**：`nums[i], nums[nums[i]-1]` 这个交换顺序有问题！因为 C++ 中右侧的 `nums[i]` 会先被计算还是先被赋值？正确写法是用临时变量或先存正确位置：`correct_pos = nums[i] - 1; nums[i], nums[correct_pos] = nums[correct_pos], nums[i]`。
- **死循环处理**：`nums[nums[i] - 1] != nums[i]` 这个条件防止了死循环——如果目标位置已经有相同的值，说明重复，不需要交换。
- **值范围判断**：只处理 `1 <= nums[i] <= n` 的值，负数、0、大于 n 的值不参与交换。
- **索引从 0 开始**：值 x 对应索引 x-1，不是 x。这是最常见的 off-by-one 错误。
- **答案范围**：如果 1~n 都存在，答案是 n+1，不是 n。

#### YXC 最终代码
```cpp
class Solution {
public:
    int firstMissingPositive(vector<int>& nums) {
        int n = nums.size();
        if (!n) return 1;

        for (auto& x : nums)
            if (x != INT_MIN) x -- ;                             // 初始化为最小可能值

        for (int i = 0; i < n; i ++ ) {                          // 遍历
            while (nums[i] >= 0 && nums[i] < n && nums[i] != i && nums[i] != nums[nums[i]]) // 将元素放到正确位置（原地哈希）
                swap(nums[i], nums[nums[i]]);                    // 交换
        }

        for (int i = 0; i < n; i ++ )                            // 遍历
            if (nums[i] != i)
                return i + 1;

        return n + 1;
    }
};
```


### 4. 矩阵置零（LeetCode 73 · Medium）

#### 题目

给定一个 m x n 的矩阵，如果某个元素为 0，则将其所在行和列的所有元素都设为 0。请原地操作。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/set-matrix-zeroes/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2422/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/370343/)
- 题目详解：[[73-矩阵置零|打开完整题解]]

#### 解题思路

**核心洞察：**

我们需要知道哪些行和哪些列需要置零。如果直接用额外数组存储：
- 行标记数组：O(m) 空间
- 列标记数组：O(n) 空间

但我们可以利用矩阵本身的第一行和第一列来存储这些标记——因为不管第一行和第一列是否被置零，它们最终都会被处理。

**关键步骤：**
1. 检查第一行和第一列本身是否有 0（备份）
2. 遍历除第一行第一列外的区域，如果遇到 0，在对应的行首和列首标记 0
3. 根据标记，将对应行和列（除第一行第一列外）置零
4. 最后根据备份，处理第一行和第一列本身

**复杂度：** O(m × n) 时间，O(1) 空间。

#### 易错点
- **边标记边置零**：如果在扫描时发现 0 就立即置零整行整列，会导致原本不是 0 的位置变成 0，从而错误地触发更多行/列置零（雪崩效应）。**标记和置零必须分两步。**
- **第一行列覆盖问题**：用第一行和第一列做标记后，它们本身的信息会被覆盖。所以必须提前备份第一行和第一列是否有 0。
- **遍历顺序**：在思路三中，从下往上遍历防止覆盖第一行的标记。
- **标记位置**：标记时 `matrix[i][0] = 0` 和 `matrix[0][j] = 0`，不要搞反了：行标记在第一列、列标记在第一行。
- **索引范围**：`matrix[i][0]` 是第 i 行的第一个元素（标记该行），`matrix[0][j]` 是第 j 列的第一个元素（标记该列）。
- **只有一个 0 的情况**：工作正常，但要注意标记是否被正确传递。

#### YXC 最终代码
```cpp
class Solution {
public:
    void setZeroes(vector<vector<int>>& matrix) {
        if (matrix.empty() || matrix[0].empty()) return;
        int n = matrix.size(), m = matrix[0].size();

        int r0 = 1, c0 = 1;
        for (int i = 0; i < m; i ++ ) if (!matrix[0][i]) r0 = 0;
        for (int i = 0; i < n; i ++ ) if (!matrix[i][0]) c0 = 0; // 遍历

        for (int i = 1; i < m; i ++ )
            for (int j = 0; j < n; j ++ )
                if (!matrix[j][i])
                    matrix[0][i] = 0;

        for (int i = 1; i < n; i ++ )
            for (int j = 0; j < m; j ++ )
                if (!matrix[i][j])
                    matrix[i][0] = 0;

        for (int i = 1; i < m; i ++ )
            if (!matrix[0][i])
                for (int j = 0; j < n; j ++ )
                    matrix[j][i] = 0;

        for (int i = 1; i < n; i ++ )
            if (!matrix[i][0])
                for (int j = 0; j < m; j ++ )
                    matrix[i][j] = 0;

        if (!r0) for (int i = 0; i < m; i ++ ) matrix[0][i] = 0;
        if (!c0) for (int i = 0; i < n; i ++ ) matrix[i][0] = 0; // 遍历
    }
};
```


### 5. 螺旋矩阵（LeetCode 54 · Medium）

#### 题目

给你一个 m 行 n 列的矩阵，请按照顺时针螺旋顺序返回矩阵中的所有元素。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/spiral-matrix/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2399/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/362206/)
- 题目详解：[[54-螺旋矩阵|打开完整题解]]

#### 解题思路

**核心洞察：**

维护四个边界：`top`, `bottom`, `left`, `right`。按顺时针方向遍历四条边，每遍历一条边就将对应的边界收缩一格。

关键点在于：在遍历下边和左边之前，需要检查边界是否已经交叉，以防只剩一行或一列时重复遍历。

**复杂度：** O(m × n) 时间，O(1) 额外空间（输出数组不计）。

#### 易错点
- **下边和左边的边界检查**：遍历完上边和右边后，`top` 和 `right` 已更新。在遍历下边前必须检查 `top <= bottom`（防止只剩一列时重复遍历），在遍历左边前必须检查 `left <= right`（防止只剩一行时重复遍历）。
- **range 的步长**：从右到左遍历时 `range(right, left-1, -1)`，从下到上遍历时 `range(bottom, top-1, -1)`。注意 `left-1` 和 `top-1` 是因为 `range` 是左闭右开区间。
- **非方阵处理**：当 m ≠ n 时，螺旋遍历到最后可能只剩一行或一列，边界检查变得尤为重要。
- **单行/单列**：如果只有一行（top == bottom），遍历上边就够了，不需要再遍历下边。
- **死循环**：没有正确更新边界或边界检查条件不对可能导致死循环。

#### YXC 最终代码
```cpp
class Solution {
public:
    vector<int> spiralOrder(vector<vector<int>>& matrix) {
        vector<int> res;
        int n = matrix.size();
        if (!n) return res;
        int m = matrix[0].size();

        int dx[] = {0, 1, 0, -1}, dy[] = {1, 0, -1, 0};
        vector<vector<bool>> st(n, vector<bool>(m));

        for (int i = 0, x = 0, y = 0, d = 0; i < n * m; i ++ ) {
            res.push_back(matrix[x][y]);                         // 记录结果
            st[x][y] = true;

            int a = x + dx[d], b = y + dy[d];
            if (a < 0 || a >= n || b < 0 || b >= m || st[a][b]) {
                d = (d + 1) % 4;
                a = x + dx[d], b = y + dy[d];
            }

            x = a, y = b;
        }

        return res;
    }
};
```


### 6. 旋转图像（LeetCode 48 · Medium）

#### 题目

给定一个 n × n 的二维矩阵，请你将图像顺时针旋转 90 度。要求原地操作。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/rotate-image/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2385/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/356298/)
- 题目详解：[[48-旋转图像|打开完整题解]]

#### 解题思路

**核心洞察：**

顺时针旋转 90 度可以拆解为两个简单步骤：
1. **转置**：沿主对角线（左上到右下）翻转，即 `matrix[i][j]` 与 `matrix[j][i]` 交换
2. **翻转**：每行逆序（左右翻转），即 `matrix[i].reverse()`

**数学原理：**

**复杂度：** O(n²) 时间，O(1) 空间。

#### 易错点
- **转置的遍历范围**：`j` 从 `i+1` 开始，只遍历上三角（或下三角），不要从 0 开始，否则会交换两次回到原样。
- **逆时针旋转**：先翻转后转置（而不是先转置后翻转）。
- **n 为奇数**：中心元素在旋转中不变，但循环覆盖时要确保它不被覆盖到也不需要旋转。
- **反转 vs 逆序**：在 C++ 中 `matrix[i].reverse()` 是原地反转，`matrix[i] = matrix[i][::-1]` 会创建新列表。
- **循环覆盖的范围**：四元素环状交换法中的 `range((n + 1) // 2) ` 对奇偶 n 的处理，容易搞错。
- **旋转公式混淆**：顺时针 90 度是 `(i, j) → (j, n-1-i)`，顺时针 180 度是 `(i, j) → (n-1-i, n-1-j)`，逆时针 90 度是 `(i, j) → (n-1-j, i)`。

#### YXC 最终代码
```cpp
class Solution {
public:
    void rotate(vector<vector<int>>& matrix) {
        int n = matrix.size();
        for (int i = 0; i < n; i ++ )                            // 遍历
            for (int j = 0; j < i; j ++ )
                swap(matrix[i][j], matrix[j][i]);                // 交换

        for (int i = 0; i < n; i ++ )                            // 遍历
            for (int j = 0, k = n - 1; j < k; j ++, k -- )
                swap(matrix[i][j], matrix[i][k]);                // 交换
    }
};
```


### 7. 搜索二维矩阵 II（LeetCode 240 · Medium）

#### 题目

编写一个高效的算法来搜索 m x n 矩阵中的一个目标值。该矩阵每行从左到右升序，每列从上到下升序。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/search-a-2d-matrix-ii/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2634/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/445234/)
- 题目详解：[[240-搜索二维矩阵II|打开完整题解]]

#### 解题思路

**核心洞察：**

从右上角 `(0, n-1)` 出发，利用行列单调性：
- `matrix[row][col] > target` → 当前元素太大了，该列下面的元素都更大，排除当前列，`col--`
- `matrix[row][col] < target` → 当前元素太小了，该行左边的元素都更小，排除当前行，`row++`
- `matrix[row][col] == target` → 找到

**为什么是右上角而不是左上角？**
从左上角 `(0, 0)` 出发，它的右边和下边都比它大，无法判断往哪边走。右上角的特殊性在于它既是行的最大值又是列的最小值，有确定的"大→左移，小→下移"规则。

**复杂度：** O(m + n) 时间，O(1) 空间。

#### 易错点
- **越界检查**：`while row < m and col >= 0` 或 `while row >= 0 and col < n`，一不小心就索引越界。
- **空矩阵**：虽然题目说 m,n >= 1，但养成防御性检查的习惯总没错。
- **与 74 题混淆**：[[74-搜索二维矩阵|74-搜索二维矩阵]] 中矩阵是"下一行首大于上一行末"，可以当成一维数组直接二分。本题的矩阵没有这个性质，不能直接二分。
- **二分法的适用条件**：逐行二分的做法需要每行有序，本题确实满足，但不是最优解。
- **右上角 vs 左上角**：千万不要从左上角开始搜索——两边都比当前值大，无法判断方向。
- **重复元素**：矩阵可以包含重复元素（题目没说唯一），但搜索找到任意一个即可。

#### YXC 最终代码
```cpp
class Solution {
public:
    bool searchMatrix(vector<vector<int>>& matrix, int target) {
        if (matrix.empty() || matrix[0].empty()) return false;
        int n = matrix.size(), m = matrix[0].size();
        int i = 0, j = m - 1;  // 从右上角出发
        while (i < n && j >= 0) {
            int t = matrix[i][j];
            if (t == target) return true;
            else if (t > target) j -- ;  // 当前值太大，排除当前列
            else i ++ ;  // 当前值太小，排除当前行
        }
        return false;
    }
};
```




## Day 4：链表基础

### 1. 相交链表（LeetCode 160 · Easy）

#### 题目

给你两个单链表的头节点，请你找出并返回两个单链表相交的起始节点。如果两个链表没有交点，返回 null。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/intersection-of-two-linked-lists/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2537/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/411074/)
- 题目详解：[[160-相交链表|打开完整题解]]

#### 解题思路

**为什么这样想：** 设链表 A 的不相交部分长度为 a，链表 B 的不相交部分为 b，相交部分为 c。指针 pA 走完自己的路 a+c，再走 b 到相交点；指针 pB 走完自己的路 b+c，再走 a 到相交点。两者总路程都是 a+b+c，因此必然同时到达相交点。

**关键洞察：** 两个指针分别从不同起点出发，通过「交换赛道」消除长度差，最终在相交点相遇。如果没有相交点，则它们会同时到达 null。

#### 易错点
- **值相等不等于节点相交：** 相交判断的是节点引用（`pA is pB`），不是节点值相等（`pA.val == pB.val`）。两个不同节点可以有相同的值
- **空链表处理：** 任一链表为空时直接返回 nullptr
- **无相交情况：** 等路程法在无相交时会同时到达 nullptr，返回 nullptr，不需要特殊判断
- **死循环风险：** 等路程法的 while 循环条件用 `pA != pB`，如果链表不相交且代码写错（没有换路逻辑），会产生死循环
- **交换赛道的时机：** 是 `pA = pA ? pA->next : headB`，而不是 `pA = pA->next ? pA->next : headB`。前者在 pA 为 nullptr 时换路，后者会跳过最后一个节点

#### YXC 最终代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    ListNode *getIntersectionNode(ListNode *headA, ListNode *headB) {
        auto p = headA, q = headB;
        while (p != q) {
            p = p ? p->next : headB;                             
            q = q ? q->next : headA;                             
        }
        return p;
    }
};
```


### 2. 反转链表（LeetCode 206 · Easy）

#### 题目

给你单链表的头节点，请你反转链表，并返回反转后的链表。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/reverse-linked-list/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2574/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/426277/)
- 题目详解：[[206-反转链表|打开完整题解]]

#### 解题思路

**为什么这样想：** 反转一个节点的核心操作是 `cur->next = pre`，但这样会断开与后续节点的连接。所以需要一个指针 `nxt` 先保存后续节点。反转完当前节点后，三个指针整体后移一位，重复操作。

**关键洞察：** pre 始终指向「已反转部分的头节点」，cur 指向「当前待反转的节点」。每次迭代把 cur 从原链表中「摘下来」放到 pre 的前面。

#### 易错点
- **断链问题：** 执行 `cur->next = pre` 之前，一定要先保存 `nxt = cur->next`，否则后续节点丢失
- **递归返回值：** 递归的核心是返回 new_head（即原链表尾节点），不是 head
- **尾节点处理：** 反转后原头节点变成尾节点，要记得将 `head->next` 设为 nullptr，否则形成环
- **空链表和单节点：** 这两种情况直接返回 head，反转前和反转后结果一样
- **pre 初始化：** pre 必须初始化为 nullptr，因为反转后头节点的 next 指向 nullptr

#### YXC 最终代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        if (!head) return NULL;
        auto a = head, b = a->next;                              
        while (b) {
            auto c = b->next;                                    
            b->next = a;                                         
            a = b;
            b = c;
        }
        head->next = NULL;                                       
        return a;
    }
};
```


### 3. 回文链表（LeetCode 234 · Easy）

#### 题目

给你一个单链表的头节点，请你判断该链表是否为回文链表。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/palindrome-linked-list/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2615/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/439511/)
- 题目详解：[[234-回文链表|打开完整题解]]

#### 解题思路

**为什么这样想：** 回文需要比较对称位置的值。数组可以用双指针从两端向中间移动，但链表不支持反向遍历。所以我们将后半段链表反转，这样就能用两个指针分别从前半段和后半段的起点开始，向中间移动比较。

**关键洞察：** 快慢指针找中点时，快指针走两步、慢指针走一步。结束时，如果节点数为奇数，慢指针正好在中间节点；如果为偶数，慢指针在中间偏右。我们需要的是后半段的起点，所以直接让慢指针作为后半段起点即可。

#### 易错点
- **奇数/偶数节点处理：** 奇数节点时中间节点不需要参与比较（前后各半），用 `while right` 而不是 `while left and right` 可以自然处理
- **反转后链表结构改变：** 函数返回后原链表结构已被改变，虽然本题不要求恢复，但在工程中需要注意
- **快慢指针起始：** 有些写法将 fast 初始化为 `head->next`，这会影响中点的位置，务必保持一致
- **空链表和单节点：** 空链表或只有一个节点时直接返回 true
- **比较终止条件：** 用反转后的后半段作为遍历依据，不要用前半段，因为前半段可能更长

#### YXC 最终代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    bool isPalindrome(ListNode* head) {
        int n = 0;
        for (auto p = head; p; p = p->next) n ++ ;               
        if (n <= 1) return true;
        int half = n / 2;
        auto a = head;
        for (int i = 0; i < n - half; i ++ ) a = a->next;        // 遍历
        auto b = a->next;                                        
        for (int i = 0; i < half - 1; i ++ ) {
            auto c = b->next;                                    
            b->next = a;                                         
            a = b, b = c;
        }

        auto p = head, q = a;
        bool success = true;
        for (int i = 0; i < half; i ++ ) {
            if (p->val != q->val) {
                success = false;
                break;
            }
            p = p->next;                                         
            q = q->next;                                         
        }

        auto tail = a;
        b = a->next;                                             
        // 将链表恢复原状
        for (int i = 0; i < half - 1; i ++ ) {
            auto c = b->next;                                    
            b->next = a;                                         
            a = b, b = c;
        }

        tail->next = NULL;                                       
        return success;
    }
};
```


### 4. 环形链表（LeetCode 141 · Easy）

#### 题目

给你一个链表的头节点，判断链表中是否有环。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/linked-list-cycle/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2511/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/404934/)
- 题目详解：[[141-环形链表|打开完整题解]]

#### 解题思路

**为什么这样想：** 如果链表中存在环，遍历就会无限循环。我们需要一种在不使用额外空间的情况下检测循环的方法。快慢指针的核心思想是：在环中，快指针每次比慢指针多走一步，相对速度差为 1，所以快指针一定会追上慢指针。

**关键洞察：** 为什么快指针要走两步而不是三步或更多？因为步数差为 1 能保证快指针不会「跳过」慢指针（在环中每轮追一步）。如果步差大于 1，在某些环长的情况下可能永远追不上。

#### 易错点
- **fast->next 的空指针检查：** `while (fast && fast->next)` 两者都必须检查，因为 `fast = fast->next->next` 需要 fast->next 不为空
- **空链表和单节点无环：** head 为空或 head->next 为空时，不可能有环，直接返回 false
- **自环（单节点成环）：** 一个节点且 next 指向自身，快慢指针会在第一轮相遇（slow = head, fast = head, 循环中 slow=slow->next=head, fast=fast->next->next=head）
- **while 循环条件：** 不是 `while (fast->next && fast->next->next)`，而是 `while (fast && fast->next)`
- **初始位置：** slow 和 fast 都初始化为 head，而不是一前一后

#### YXC 最终代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    bool hasCycle(ListNode *head) {
        if (!head || !head->next) return false;
        auto s = head, f = head->next;                           
        while (f) {
            s = s->next, f = f->next;                            
            if (!f) return false;
            f = f->next;                                         
            if (s == f) return true;
        }
        return false;
    }
};
```


### 5. 环形链表 II（LeetCode 142 · Medium）

#### 题目

给定一个链表的头节点，返回链表开始入环的第一个节点。如果链表无环，则返回 null。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/linked-list-cycle-ii/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2512/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/404952/)
- 题目详解：[[142-环形链表II|打开完整题解]]

#### 解题思路

**为什么这样想：** 快慢指针相遇后，我们需要知道环入口的位置。通过数学推导发现一个关键等式：从 head 到环入口的距离 = 从相遇点到环入口的距离（沿着前进方向）。

**数学推导：** 设 head 到入口距离为 a，入口到相遇点距离为 b，相遇点到入口距离为 c（环剩余部分）。
- slow 走的距离：a + b
- fast 走的距离：a + b + c + b = a + 2b + c（fast 在环里多走了一圈多）
- 因为 fast 走的距离 = 2 * slow 走的距离：a + 2b + c = 2(a + b) → c = a

所以从 head 和相遇点同步出发，相遇处就是入口。

#### 易错点
- **第二阶段指针速度相同：** 找到相遇点后，两个指针都一次走一步，不是快慢指针了
- **起点设置：** 第二阶段必须让其中一个指针回到 head，另一个留在相遇点，然后同时移动
- **无环处理：** 如果第一阶段没有相遇，直接返回 nullptr，不进入第二阶段
- **空链表和单节点：** 空链表或只有一个自环的节点需要处理——如果是自环则返回 head，无环则返回 nullptr
- **头节点就是入口：** 如果头节点就在环中，此时 a = 0，第一阶段 slow 和 fast 在 head 相遇，第二阶段直接返回 head

#### YXC 最终代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    ListNode *detectCycle(ListNode *head) {
        if (!head || !head->next) return NULL;
        auto s = head, f = head->next;                           
        while (f) {
            s = s->next, f = f->next;                            
            if (!f) return NULL;
            f = f->next;                                         
            if (s == f) {
                s = head, f = f->next;                           
                while (s != f) s = s->next, f = f->next;         
                return s;
            }
        }
        return NULL;
    }
};
```


### 6. 合并两个有序链表（LeetCode 21 · Easy）

#### 题目

将两个升序链表合并为一个新的升序链表并返回。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/merge-two-sorted-lists/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2354/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/347807/)
- 题目详解：[[21-合并两个有序链表|打开完整题解]]

#### 解题思路

**为什么这样想：** 需要不断从两个链表中选取较小节点接到结果链表的尾部。使用「虚拟头节点」可以统一处理空链表的情况，不需要单独处理结果链表的第一次插入。

**关键洞察：** 每次取较小节点接到 cur 后面后，对应链表的指针前移一位。当其中一个链表遍历完，直接将另一个链表剩余部分接到结果后面即可。

#### 易错点
- **虚拟头节点返回：** 返回的是 `dummy.next` 而不是 `dummy` 或 `cur`
- **cur 的移动：** 每次拼接后要记得 `cur = cur->next`，否则结果链表只有一个节点
- **剩余节点拼接：** 最后要用 `cur->next = l1 ? l1 : l2`，而不是用 while 循环一个个拼接
- **递归终止条件：** 两个链表都可能为空，所以需要分别检查 `not l1` 和 `not l2`
- **相等值处理：** 用 `<=` 保证合并的稳定性（先取 l1 的节点）

#### YXC 最终代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* mergeTwoLists(ListNode* l1, ListNode* l2) {
        auto dummy = new ListNode(-1), tail = dummy;
        while (l1 && l2) {
            if (l1->val < l2->val) {
                tail = tail->next = l1;                          
                l1 = l1->next;                                   
            } else {
                tail = tail->next = l2;                          
                l2 = l2->next;                                   
            }
        }

        if (l1) tail->next = l1;                                 
        if (l2) tail->next = l2;                                 
        return dummy->next;
    }
};
```


### 7. 两数相加（LeetCode 2 · Medium）

#### 题目

给你两个非空的链表，表示两个非负的整数。它们每位数字都是按照逆序方式存储的，请你将两个数相加，并以相同形式返回一个表示和的链表。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/add-two-numbers/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2327/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/339832/)
- 题目详解：[[2-两数相加|打开完整题解]]

#### 解题思路

**为什么这样想：** 逆序存储意味着我们可以直接同步遍历两个链表，模拟竖式加法的逐位相加过程。关键是用一个变量 `carry` 记录进位。

**关键洞察：** 循环条件用 `while l1 or l2 or carry` 可以统一处理三个情况：链表还有节点、链表遍历完了但还有进位。当某个链表遍历完时，对应的 val 视为 0。

#### 易错点
- **最后一位进位：** 当两个链表都遍历完后，如果 carry 仍为 1，需要额外创建一个值为 1 的节点
- **循环条件：** 用 `while l1 or l2 or carry` 而不是 `while l1 and l2`，前者能处理长度不等的进位情况
- **取 val 时判空：** `l1.val if l1 else 0` 而不是直接 `l1.val`，因为 l1 可能已经为空
- **链表前进：** 只有当前节点不为空时才移动指针，否则会在 nullptr 上调用 .next
- **虚拟头节点返回：** 返回 `dummy.next` 而不是 `cur`

#### YXC 最终代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        auto dummy = new ListNode(-1), cur = dummy;
        int t = 0;
        while (l1 || l2 || t) {
            if (l1) t += l1->val, l1 = l1->next;                 
            if (l2) t += l2->val, l2 = l2->next;                 
            cur = cur->next = new ListNode(t % 10);  // 创建新节点，存储当前位
            t /= 10;  // 进位：t整除10
        }
        return dummy->next;
    }
};
```


### 8. 删除链表的倒数第 N 个节点（LeetCode 19 · Medium）

#### 题目

给你一个链表，删除链表的倒数第 n 个节点，并返回链表的头节点。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2352/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/346852/)
- 题目详解：[[19-删除链表的倒数第N个节点|打开完整题解]]

#### 解题思路

**为什么这样想：** 要找到倒数第 n 个节点，本质是找到距离末尾 n 步的节点。但单链表不知道末尾在哪里。让快指针先走 n+1 步（指向倒数第 n 个节点的前一个），然后两个指针同步走直到快指针到末尾，此时慢指针就停在待删节点的前一个位置。

**关键洞察：** 快指针先走 n+1 步而不是 n 步，是为了让慢指针指向待删节点的前驱，这样才能执行删除操作。

#### 易错点
- **快指针先走 n+1 步：** 如果走了 n 步，慢指针就指向待删节点本身而不是前驱，无法执行删除
- **虚拟头节点：** 删除头节点时，如果没有 dummy，`head = head->next` 可以，但代码需要分支处理。用 dummy 可以统一逻辑
- **n 的合法性：** 题目保证 n 有效，但通用代码应考虑 n 是否超过链表长度
- **dummy 初始连接：** `dummy = ListNode(0, head)` 不能漏掉 head 参数，否则 dummy 与链表断开
- **返回值：** 始终返回 `dummy.next`，而不是 head（head 可能已被删除）

#### YXC 最终代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    ListNode* removeNthFromEnd(ListNode* head, int k) {
        auto dummy = new ListNode(-1);
        dummy->next = head;                                      

        int n = 0;
        for (auto p = dummy; p; p = p->next) n ++ ;              

        auto p = dummy;
        for (int i = 0; i < n - k - 1; i ++ ) p = p->next;       // 遍历
        p->next = p->next->next;                                 

        return dummy->next;
    }
};
```




## Day 5：链表进阶

### 1. 两两交换链表中的节点（LeetCode 24 · Medium）

#### 题目

给你一个链表，两两交换其中相邻的节点，并返回交换后链表的头节点。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/swap-nodes-in-pairs/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2357/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/347847/)
- 题目详解：[[24-两两交换链表中的节点|打开完整题解]]

#### 解题思路

**为什么这样想：** 每次交换两个节点，需要知道这两个节点的前驱。第一对没有前驱，所以用虚拟头节点作为统一前驱。画图理解指针重指向是关键。

**关键洞察：** 交换一对节点 (p1, p2) 涉及 3 条指针的修改：
1. pre->next 指向 p2（p2 成为第一个）
2. p1->next 指向 p2->next（p1 与后续连接）
3. p2->next 指向 p1（p2 指向 p1）

#### 易错点
- **三步交换的顺序：** 必须按照 pre→p2 → p1→next → p2→p1 的顺序，不能乱。修改 pre->next 之前必须保证 p1、p2 已正确赋值
- **pre 的移动：** 交换后 pre 移到 p1（原第一个节点，现在是第二对的前驱），而不是移到 p2
- **循环条件：** `while (pre->next && pre->next->next)` 检查是否有两个可交换的节点
- **奇数个节点：** 最后一个节点不参与交换，自然保留在末尾
- **图解辅助：** 强烈建议画图理解指针变化，链表指针操作光靠脑子想很容易出错

#### YXC 最终代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    ListNode* swapPairs(ListNode* head) {
        auto dummy = new ListNode(-1);
        dummy->next = head;                                      
        for (auto p = dummy; p->next && p->next->next;) {        
            auto a = p->next, b = a->next;                       
            p->next = b;                                         
            a->next = b->next;                                   
            b->next = a;                                         
            p = a;
        }

        return dummy->next;
    }
};
```


### 2. K 个一组翻转链表（LeetCode 25 · Hard）

#### 题目

给你链表的头节点，每 k 个节点一组进行翻转，返回修改后的链表。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/reverse-nodes-in-k-group/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2358/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/347863/)
- 题目详解：[[25-K个一组翻转链表|打开完整题解]]

#### 解题思路

**为什么这样想：** 将问题拆分成三个子问题：
1. 检测当前是否还有 K 个节点（不够则直接返回）
2. 翻转一个长度为 K 的子链表（复用 206 题的反转逻辑）
3. 组间重连（将翻转后的组正确地接入主链）

**关键洞察：** 翻转 K 个节点前，需要记录四个关键位置：前驱节点 pre、当前组头节点 group_head、当前组尾节点（即原 group_head，翻转后变成尾）、下一组的头节点 next_group。翻转后：pre->next = 新头，group_head->next = next_group。

#### 易错点
- **不足 K 个的处理：** 剩余不足 K 个时保持原序，不能翻转。检查时机是翻转之前
- **组间连接：** 翻转后 group_head->next 必须指向 next_group，否则链表会在组间断裂
- **pre 的更新：** 每次处理完一组后，pre 要更新为 group_head（翻转后的组尾），它是下一组的前驱
- **dummy.next 的返回：** 必须返回 dummy.next，因为原 head 可能已不在链首
- **K=1 的优化：** k=1 时不需要任何操作，可以直接返回 head
- **边界：** 空链表或 k=1，直接返回 head

#### YXC 最终代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    ListNode* reverseKGroup(ListNode* head, int k) {
        auto dummy = new ListNode(-1);
        dummy->next = head;                                      
        for (auto p = dummy;;) {
            auto q = p;
            for (int i = 0; i < k && q; i ++ ) q = q->next;      
            if (!q) break;
            auto a = p->next, b = a->next;                       
            for (int i = 0; i < k - 1; i ++ ) {
                auto c = b->next;                                
                b->next = a;                                     
                a = b, b = c;
            }
            auto c = p->next;                                    
            p->next = a, c->next = b;                            
            p = c;
        }
        return dummy->next;
    }
};
```


### 3. 随机链表的复制（LeetCode 138 · Medium）

#### 题目

给你一个长度为 n 的链表，每个节点包含一个额外的随机指针，请构造这个链表的深拷贝。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/copy-list-with-random-pointer/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2508/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/400796/)
- 题目详解：[[138-随机链表的复制|打开完整题解]]

#### 解题思路

**为什么这样想：** 不用哈希表，而是利用原链表的 next 指针来建立映射关系。在每一个原节点后面插入其克隆节点，这样原节点到克隆节点的映射关系天然地通过 next 指针建立起来：`原节点.next = 克隆节点`。那么原节点->random->next 就是克隆节点的 random 指向。

**关键洞察：** `克隆节点->random = 原节点->random->next`。因为原节点->random 指向原链表的某个节点，该节点的 next 就是对应的克隆节点。这样不需要额外空间就完成了 random 指针的设置。

#### 易错点
- **三步法的拆分步骤：** 拆分时不仅要恢复原链表的 next，还要正确设置克隆链表的 next，两个链表要同时恢复
- **random 为 null 的情况：** `cur->random->next` 会崩溃，必须先判断 `if (cur->random)`。哈希表法中用 `mapping.count(cur->random) ? mapping[cur->random] : nullptr` 返回 nullptr 处理
- **三步法第二步的遍历：** 用 `cur->next->next` 跳过一个偶数步（原→克隆→原→克隆），不是 `cur = cur->next`
- **拆分时 clone->next 的判断：** 当 clone->next 不存在时，说明到了链表末尾，不能访问 clone->next->next
- **深拷贝的含义：** 新链表的每个节点都是新创建的对象，原链表的修改不应影响新链表

#### YXC 最终代码
```cpp
/*
// Definition for a Node.
class Node {
public:
    int val;
    Node* next;
    Node* random;

    Node(int _val) {
        val = _val;
        next = NULL; 
        random = NULL;
    }
};
*/

class Solution {
public:
    Node* copyRandomList(Node* head) {
        for (auto p = head; p; p = p->next->next) {  // 第一步：在每个原节点后插入克隆节点
            auto q = new Node(p->val);
            q->next = p->next;                                   
            p->next = q;                                         
        }

        // 复制random指针
        for (auto p = head; p; p = p->next->next)                
            if (p->random)
                p->next->random = p->random->next;               

        // 第三步：拆分两个链表（交错拆分）
        auto dummy = new Node(-1), cur = dummy;
        for (auto p = head; p; p = p->next) {                    
            auto q = p->next;                                    
            cur = cur->next = q;                                 
            p->next = q->next;                                   
        }
        return dummy->next;
    }
};
```


### 4. 排序链表（LeetCode 148 · Medium）

#### 题目

给你链表的头结点，将其按升序排列并返回排序后的链表。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/sort-list/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2518/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/405095/)
- 题目详解：[[148-排序链表|打开完整题解]]

#### 解题思路

**为什么这样想：** 链表归并排序天然适合链表结构。找中点可以用快慢指针（O(n)），断开后递归排序，然后合并两个有序链表（复用 21 题）。整体 O(n log n)，但递归栈空间为 O(log n)。

**关键洞察：** 快慢指针找中点时，fast 初始化为 `head->next` 可以使 slow 停在「中间偏左」，这样 `slow->next` 就是右半段的头，然后将 slow->next 断开。

#### 易错点
- **快慢指针找中点：** fast 初始化为 `head->next` 让 slow 停在左半段的末尾，而不是中点。右半段起点是 `slow->next`
- **断开链表：** `slow->next = nullptr` 必须执行，否则递归时会出现无限循环
- **自顶向下的空间：** 自顶向下递归的空间复杂度是 O(log n)（递归栈），不是 O(1)
- **自底向上的拆分：** split 函数要小心处理剩余长度不足 n 的情况
- **merge 后的 prev：** 合并后 prev 需要移动到合并链表的尾部，不要忘了
- **空链表和单节点：** 排序前先检查，空或只有一个节点直接返回

#### YXC 最终代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    ListNode* sortList(ListNode* head) {
        int n = 0;
        for (auto p = head; p; p = p->next) n ++ ;               

        for (int i = 1; i < n; i *= 2) {  // 子链表长度：1,2,4,8,...
            auto dummy = new ListNode(-1), cur = dummy;
            for (int j = 1; j <= n; j += i * 2) {  // 每轮合并相邻的两个长度为i的子链表
                auto p = head, q = p;
                for (int k = 0; k < i && q; k ++ ) q = q->next;  
                auto o = q;
                for (int k = 0; k < i && o; k ++ ) o = o->next;  
                int l = 0, r = 0;
                while (l < i && r < i && p && q)
                    if (p->val <= q->val) cur = cur->next = p, p = p->next, l ++ ; 
                    else cur = cur->next = q, q = q->next, r ++ ; 
                while (l < i && p) cur = cur->next = p, p = p->next, l ++ ; 
                while (r < i && q) cur = cur->next = q, q = q->next, r ++ ; 
                head = o;
            }
            cur->next = NULL;                                    
            head = dummy->next;                                  
        }

        return head;
    }
};
```


### 5. 合并 K 个升序链表（LeetCode 23 · Hard）

#### 题目

给你一个链表数组，每个链表都已经按升序排列。请你将所有链表合并到一个升序链表中。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/merge-k-sorted-lists/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2356/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/347836/)
- 题目详解：[[23-合并K个升序链表|打开完整题解]]

#### 解题思路

**为什么这样想：** 每次从 K 个链表的头节点中取最小值，最直接的做法是遍历 K 个头找最小，O(K) 每次，总复杂度 O(NK)。用最小堆可以将找最小优化到 O(log K)。堆中始终维护当前 K 个链表当前的头节点。

**关键洞察：** C++ 的 priority_queue 不支持直接比较 ListNode 对象，所以需要在堆中存入 (node.val, index, node) 三元组。其中 index 用于处理值相等时避免比较 ListNode 对象。

#### 易错点
- **堆中存入三元组：** 不能只存 (node.val, node)，因为 priority_queue 在 val 相同时会尝试比较 node（ListNode 对象），而 ListNode 没有定义比较操作，会报错。用 (val, index, node) 三元组解决
- **空链表处理：** 链表数组中可能有空链表（nullptr），在加入堆和分治时都要跳过
- **lists 为空：** 如果 lists 是空数组，直接返回 nullptr
- **分治法的截止条件：** `len(lists) == 1` 返回 lists[0]，不是返回 head
- **堆的更新：** 弹出最小节点后，如果它的 next 不为空，要立即将 next 节点入堆

#### YXC 最终代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:

    struct Cmp {  // 自定义比较器，小根堆
        bool operator() (ListNode* a, ListNode* b) {
            return a->val > b->val;  // 值越大优先级越低（小根堆）
        }
    };

    ListNode* mergeKLists(vector<ListNode*>& lists) {
        priority_queue<ListNode*, vector<ListNode*>, Cmp> heap;
        auto dummy = new ListNode(-1), tail = dummy;
        for (auto l : lists) if (l) heap.push(l);

        while (heap.size()) {
            auto t = heap.top();
            heap.pop();

            tail = tail->next = t;                               
            if (t->next) heap.push(t->next);
        }

        return dummy->next;
    }
};
```


### 6. LRU 缓存（LeetCode 146 · Medium）

#### 题目

请你设计并实现一个满足 LRU 缓存约束的数据结构，支持 get 和 put 操作，时间复杂度 O(1)。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/lru-cache/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2516/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/405014/)
- 题目详解：[[146-LRU缓存|打开完整题解]]

#### 解题思路

**为什么这样想：** 我们需要同时满足 O(1) 查找和 O(1) 插入/删除。哈希表提供 O(1) 查找（key → 节点），双向链表提供 O(1) 的节点移动和删除。两者结合正好互补。

**关键洞察：** 双向链表维护使用顺序。最近使用的节点在头部，最久未使用的在尾部。每次访问（get/put）一个节点，就把它移动到头部。当容量满时，删除尾部节点。

为什么要用「虚拟头尾节点」？避免处理空链表和边界条件时的 nullptr 检查，大大简化代码。

#### 易错点
- **双向链表指针修改顺序：** 修改 4 个指针的顺序不能错。先连接新节点和 head->next，再连接 head 和新节点。建议画图确认
- **head 和 tail 是虚拟节点：** 不是实际数据节点，所以 cache 中存的 key 不会等于 head 或 tail
- **淘汰时哈希表和链表都要删：** 删除尾部节点后，一定要执行 `del self.cache[removed.key]`，否则哈希表泄露
- **put 更新已有 key 时：** 先更新 node.val 再移到头部，否则移到头部后 node 的引用还在
- **get 不存在的 key：** 返回 -1 而不是 nullptr，注意题目要求
- **capacity = 1：** 每次 put 都会触发淘汰，head->next 和 tail->prev 指向同一个节点

#### YXC 最终代码
```cpp
class LRUCache {
public:
    struct Node {
        int key, val;
        Node *left, *right;
        Node(int _key, int _val): key(_key), val(_val), left(NULL), right(NULL) {}
    }*L, *R;
    unordered_map<int, Node*> hash;                              // 哈希表，O(1)查找
    int n;

    void remove(Node* p) {  // 从双向链表中删除节点
        p->right->left = p->left;
        p->left->right = p->right;
    }

    void insert(Node* p) {  // 将节点插入到链表头部（最近使用）
        p->right = L->right;  // 插入头部：连接右邻居
        p->left = L;
        L->right->left = p;
        L->right = p;  // 插入头部：虚拟头节点指向p
    }

    LRUCache(int capacity) {
        n = capacity;
        L = new Node(-1, -1), R = new Node(-1, -1);
        L->right = R, R->left = L;
    }

    int get(int key) {
        if (hash.count(key) == 0) return -1;                     // 查找是否在哈希表中
        auto p = hash[key];
        remove(p);
        insert(p);
        return p->val;
    }

    void put(int key, int value) {
        if (hash.count(key)) {                                   // 查找是否在哈希表中
            auto p = hash[key];
            p->val = value;
            remove(p);
            insert(p);
        } else {
            if (hash.size() == n) {
                auto p = R->left;  // 找到最久未使用的节点（尾节点）
                remove(p);
                hash.erase(p->key);
                delete p;
            }
            auto p = new Node(key, value);
            hash[key] = p;
            insert(p);
        }
    }
};

/**
 * Your LRUCache object will be instantiated and called as such:
 * LRUCache* obj = new LRUCache(capacity);
 * int param_1 = obj->get(key);
 * obj->put(key,value);
 */
```




## Day 6：二叉树基础

### 1. 二叉树的中序遍历（LeetCode 94 · Easy）

#### 题目

给定一个二叉树的根节点，返回它的中序遍历。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/binary-tree-inorder-traversal/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2447/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/379732/)
- 题目详解：[[94-二叉树的中序遍历|打开完整题解]]

#### 解题思路

中序遍历的递归写法是最直观的。利用函数调用栈天然地实现「先深入左子树 → 回到根 → 再深入右子树」的过程。

**为什么选这个遍历顺序？** 中序就是「左→根→右」，递归的天然结构完美匹配这个顺序：先递归左子树，再访问当前节点，最后递归右子树。

#### 易错点
- **忘记 base case：** 递归函数中必须先处理 `if (!node) return;`，否则会访问空指针。
- **迭代法忘记转向右子树：** 弹出访问完节点后，必须将 cur 指向 cur.right，否则会死循环。
- **Morris 遍历修改了树：** 虽然最后会恢复，但如果在遍历过程中读取树结构会有问题（多线程环境不安全）。
- **将结果放入的位置搞错：** 中序是在递归完左子树后、递归右子树前访问节点，放入 res。

#### YXC 最终代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
 * };
 */
class Solution {
public:
    vector<int> ans;
    vector<int> inorderTraversal(TreeNode* root) {
        dfs(root);
        return ans;
    }

    void dfs(TreeNode* root) {                                   // 深度优先搜索
        if (!root) return;
        dfs(root->left);
        ans.push_back(root->val);                                // 记录结果
        dfs(root->right);
    }
};
```


### 2. 二叉树的最大深度（LeetCode 104 · Easy）

#### 题目

给定一个二叉树，返回其最大深度。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/maximum-depth-of-binary-tree/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2457/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/384008/)
- 题目详解：[[104-二叉树的最大深度|打开完整题解]]

#### 解题思路

**核心思想：** 一棵树的最大深度 = max(左子树的最大深度, 右子树的最大深度) + 1（加上根节点这一层）。

**为什么用后序？** 因为要知道当前节点的深度，必须先知道左右子树的深度——这就是典型的「后序位置」：先处理左右子树得到结果，再汇总结果计算出当前节点的答案。这种从下往上汇总的方式叫做 **分解法**（分治思想）。

#### 易错点
- **空树返回 0 而不是 nullptr：** base case 必须返回 0，很多初学者会忘记这个特判。
- **递归时忘记 +1：** `return max(left, right)` 是错的，需要加上当前节点这一层，所以是 `1 + max(left, right)`。
- **BFS 法的 depth 递增时机：** 在进入 while 循环时就要 depth += 1，而不是在处理完一层之后。
- **前序法 depth 的初始值：** 根节点的深度是 1，所以从 `traverse(root, 1)` 开始。

#### YXC 最终代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
 * };
 */
class Solution {
public:
    int maxDepth(TreeNode* root) {
        if (!root) return 0;
        return max(maxDepth(root->left), maxDepth(root->right)) + 1;
    }
};
```


### 3. 翻转二叉树（LeetCode 226 · Easy）

#### 题目

给你一棵二叉树的根节点，翻转这棵二叉树，并返回其根节点。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/invert-binary-tree/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2607/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/439367/)
- 题目详解：[[226-翻转二叉树|打开完整题解]]

#### 解题思路

**核心思想：** 先交换当前节点的左右孩子，再递归地去翻转左右子树。

**为什么用前序？** 前序位置是在「进入一个节点后、处理子树之前」执行操作。对于翻转问题，先交换当前节点的左右孩子，然后递归处理它们——这非常符合直觉：先交换，再处理。

#### 易错点
- **交换的是子树，不是值：** 需要交换 `root.left` 和 `root.right`（让整个子树换边），而不是交换 `root.left.val` 和 `root.right.val`。
- **前序递归不需要保存返回值：** `invertTree(root.left)` 的返回值不需要赋值给任何变量，因为翻转是在原地进行的。
- **后序递归的赋值顺序：** 如果先把左子树的翻转结果赋给 root.left，再处理右子树，要注意 root.left 已经被修改了。正确做法：先保存左右，或者后序时在交换时用临时变量。
- **空节点处理：** `if (!root) return nullptr;` 是必须的 base case。

#### YXC 最终代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
 * };
 */
class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (!root) return NULL;
        swap(root->left, root->right);                           // 交换
        invertTree(root->left);
        invertTree(root->right);
        return root;
    }
};
```


### 4. 对称二叉树（LeetCode 101 · Easy）

#### 题目

给你一个二叉树的根节点，检查它是否轴对称。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/symmetric-tree/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2454/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/383977/)
- 题目详解：[[101-对称二叉树|打开完整题解]]

#### 解题思路

**核心思想：** 同时用两个指针 p 和 q，p 从根节点的左子树出发，q 从根节点的右子树出发。p 往左走时 q 往右走（镜像对称），p 往右走时 q 往左走。

**为什么用这种特殊的遍历顺序？** 普通的单指针遍历无法检查镜像对称——因为对称是需要「交叉对比」的。双指针法让两个指针按镜像轨迹移动，完美匹配对称的定义。

#### 易错点
- **比较方向搞反：** 不是 `check(p.left, q.left)`，而是 `check(p.left, q.right)`——因为是对称比较，左的左 vs 右的右。
- **空节点判断顺序：** 先判断「两者都空→true」，再判断「一个空→false」，顺序不能乱。如果先判断一个空会把两个都空的情况误判为 false。
- **迭代法 continue 而非 return：** 当两个都为空时要用 `continue` 跳过这对，而不是 `return true`，因为还有别的节点等待检查。
- **值比较用 !=：** 严格来说，对称要求值相等，所以 `p.val != q.val` 时返回 false。

#### YXC 最终代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
 * };
 */
class Solution {
public:
    bool isSymmetric(TreeNode* root) {
        if (!root) return true;
        return dfs(root->left, root->right);
    }

    bool dfs(TreeNode* p, TreeNode* q) {                         // 深度优先搜索
        if (!p && !q) return true;
        if (!p || !q || p->val != q->val) return false;
        return dfs(p->left, q->right) && dfs(p->right, q->left);
    }
};
```


### 5. 二叉树的直径（LeetCode 543 · Easy）

#### 题目

给你一棵二叉树的根节点，返回该树的直径。直径是指树中任意两个节点之间最长路径上的边数。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/diameter-of-binary-tree/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/3040/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/597701/)
- 题目详解：[[543-二叉树的直径|打开完整题解]]

#### 解题思路

**核心思想：** 每个节点的「直径贡献」= 左子树深度 + 右子树深度。在后序位置（已经知道了左右子树的深度）计算这个值，用全局变量更新最大值。

**为什么用后序？** 因为要知道「经过当前节点的最长路径」，必须先知道左子树有多深、右子树有多深——这是典型的需要子树信息来计算的场景，必须用后序。前序/中序在进入节点时还不知道子树的深度。

#### 易错点
- **直径不经过根节点：** 初学者常犯的错误是只算 `maxDepth(root.left) + maxDepth(root.right)`。但最长路径可能在左子树的内部，不经过根节点。必须每个节点都检查。
- **返回值和全局变量的区别：** 递归函数的返回值是「当前节点的深度（向上汇报用）」，而全局变量 max_d 是「当前发现的最大直径（最终答案）」。两者意义不同。
- **直径是边数不是节点数：** 如果有 3 个节点在一条链上，边数是 2，节点数是 3。本题是边数。
- **全局变量的作用域：** 在 C++ 中需要用 `nonlocal` 声明才能在嵌套函数中修改外部变量。

#### YXC 最终代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
 * };
 */
class Solution {
public:
    int ans = 0;

    int diameterOfBinaryTree(TreeNode* root) {
        dfs(root);
        return ans;
    }

    int dfs(TreeNode* root) {                                    // 深度优先搜索
        if (!root) return 0;
        int left = dfs(root->left), right = dfs(root->right);
        ans = max(ans, left + right);
        return max(left, right) + 1;
    }
};
```


### 6. 二叉树的层序遍历（LeetCode 102 · Medium）

#### 题目

给你二叉树的根节点，返回其节点值的层序遍历。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/binary-tree-level-order-traversal/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2455/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/383991/)
- 题目详解：[[102-二叉树的层序遍历|打开完整题解]]

#### 解题思路

**核心思想：** 使用队列，每次处理一整层的节点。关键技巧是 `for _ in range(q.size())`：在处理每层开始时，队列中的节点数就是该层的节点数。通过这个长度控制循环次数，保证不会混到下一层。

**为什么 BFS 适合层序？** BFS 天然是按「层」为单位推进的——先访问所有距离为 1 的节点，再访问所有距离为 2 的节点。队列 FIFO 的特性保证了先入队的上层节点先被处理。

#### 易错点
- **BFS 中 `q.size()` 必须在 `for` 循环前固定：** 如果在循环中动态取队列长度，由于会 `pop_front()` 和 `push_back()`，长度会变化。每层开始时先保存当前层节点数。
- **DFS 中 `res` 的初始化顺序：** 当第一次进入第 depth 层时，必须先 `res.push_back([])`，然后再赋值。如果 res 的长度 <= depth，说明这一层还没创建。
- **空树返回 `[]` 而不是 `[[]]`：** 空树没有节点，所以返回空列表而不是包含一个空列表。
- **BFS 不要用列表模拟队列（erase(begin()) 是 O(n)）：** 一定要用 `std::deque`，它的 `pop_front()` 是 O(1)。

#### YXC 最终代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
 * };
 */
class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        vector<vector<int>> res;
        queue<TreeNode*> q;
        if (root) q.push(root);                                  // 入队

        while (q.size()) {
            vector<int> level;
            int len = q.size();

            while (len -- ) {
                auto t = q.front();
                q.pop();                                         // 出队
                level.push_back(t->val);
                if (t->left) q.push(t->left);                    // 入队
                if (t->right) q.push(t->right);                  // 入队
            }

            res.push_back(level);                                // 记录结果
        }

        return res;
    }
};
```


### 7. 将有序数组转换为二叉搜索树（LeetCode 108 · Easy）

#### 题目

给你一个整数数组，其中元素已经按升序排列，请将其转换为一棵高度平衡的二叉搜索树。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/convert-sorted-array-to-binary-search-tree/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2461/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/384091/)
- 题目详解：[[108-将有序数组转换为二叉搜索树|打开完整题解]]

#### 解题思路

**核心思想：** 每次取数组的中间元素作为当前子树的根，左半部分递归构建左子树，右半部分递归构建右子树。由于每次都取中点，左右子树的元素数量最多相差 1，树的高度自然平衡。

**为什么这样就能保证平衡？** 因为每层递归都将数组对半分割，左右子树的节点数最多差 1，递归深度为 O(log n)。每个节点的左右子树大小基本相等，自然平衡。

#### 易错点
- **终止条件是 `left > right` 而不是 `left >= right`：** 当 left == right 时，还有一个元素需要构建节点。`>` 才是区间为空。
- **中点计算溢出问题：** 在 Java/C++ 中 `(left + right) // 2` 可能溢出，更安全的写法是 `left + (right - left) // 2`。C++ 中无此问题。
- **严格递增数组，无需处理重复值：** 题目保证严格递增，但如果是「非严格递增」，BST 的左右分配就需要考虑重复值策略。
- **取整方向：** `(left + right) // 2` 是向下取整，会偏左。如果总想偏右可以用 `(left + right + 1) // 2`。

#### YXC 最终代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
 * };
 */
class Solution {
public:
    TreeNode* sortedArrayToBST(vector<int>& nums) {
        return build(nums, 0, nums.size() - 1);
    }

    TreeNode* build(vector<int>& nums, int l, int r) {
        if (l > r) return NULL;
        int mid = l + r >> 1;
        auto root = new TreeNode(nums[mid]);
        root->left = build(nums, l, mid - 1);
        root->right = build(nums, mid + 1, r);
        return root;
    }
};
```


### 8. 验证二叉搜索树（LeetCode 98 · Medium）

#### 题目

给定一个二叉树的根节点，判断其是否是一个有效的二叉搜索树。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/validate-binary-search-tree/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2451/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/379839/)
- 题目详解：[[98-验证二叉搜索树|打开完整题解]]

#### 解题思路

**核心思想：** BST 的中序遍历结果是 **严格递增** 的序列。用全局变量 `prev` 记录上一个访问的节点值，在中序位置检查 `当前值 > prev`，如果不满足则不是 BST。

**为什么用中序？** BST 最核心的性质就是中序递增。利用这个性质来验证是最简洁、最不容易出错的方法。中序位置（左子树回来后）正好拿到了左子树处理完的状态，可以自然地与前一个值比较。

#### 易错点
- **不能只检查左右子节点：** 很多初学者写 `if root.left.val >= root.val or root.right.val <= root.val`。这是错的！因为右子树的左子节点可能小于根节点，但仍大于右子节点。必须全局约束。
- **等号的处理：** BST 要求严格小于/大于，所以检查条件是 `<=` 和 `>=` 而不是 `<` 和 `>`。
- **int 边界问题：** 节点值范围是 [-2^31, 2^31-1]，用 `LLONG_MIN` 和 `LLONG_MAX` 是最安全的。
- **递归中的短路返回：** 当左子树不是 BST 时应立即返回；C++ 可写成 `if (!inorder(node->left)) return false;`。

#### YXC 最终代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
 * };
 */
class Solution {
public:
    bool isValidBST(TreeNode* root) {
        if (!root) return true;
        return dfs(root)[0];
    }

    vector<int> dfs(TreeNode* root) {
        vector<int> res({1, root->val, root->val});  // [是否BST, 子树最小值, 子树最大值]
        if (root->left) {
            auto t = dfs(root->left);
            if (!t[0] || t[2] >= root->val) res[0] = 0;  // 左子树最大值 ≥ 当前值 → 不是BST
            res[1] = min(res[1], t[1]);
            res[2] = max(res[2], t[2]);
        }
        if (root->right) {
            auto t = dfs(root->right);
            if (!t[0] || t[1] <= root->val) res[0] = 0;  // 右子树最小值 ≤ 当前值 → 不是BST
            res[1] = min(res[1], t[1]);
            res[2] = max(res[2], t[2]);
        }
        return res;
    }
};
```




## Day 7：二叉树进阶

### 1. 二叉搜索树中第 K 小的元素（LeetCode 230 · Medium）

#### 题目

给定一个二叉搜索树的根节点和一个整数 k，请你设计一个算法查找其中第 k 小的元素。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/kth-smallest-element-in-a-bst/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2611/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/439441/)
- 题目详解：[[230-BST第K小的元素|打开完整题解]]

#### 解题思路

**核心思想：** BST 的中序遍历是递增序列，对 BST 做中序遍历，访问的第 k 个节点就是第 k 小的元素。

**为什么用中序？** 因为 BST 最核心的性质就是中序遍历结果递增。这个性质直接决定了「中序遍历的第 k 个节点 = 第 k 小元素」。不需要比较大小，不需要额外排序。

#### 易错点
- **计数器 +1 的位置：** 计数器必须在左子树遍历完之后、右子树遍历之前加 1。因为中序的顺序是左→根→右，当前节点是第几个访问的由左子树的节点数决定。
- **找到后不停止：** 递归法在找到 result 后，递归调用仍在进行。最好在赋值后设置一个标志位（或像上面的代码在 count==k 时 return），避免不必要的继续遍历。
- **k 是从 1 开始计数的：** k=1 表示第一个最小的元素，即 BST 的最左节点值。
- **迭代法 `k -= 1` 的位置：** 必须在弹出栈顶（访问节点）时减 1，而不是入栈时减 1。

#### YXC 最终代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    int k, ans;

    int kthSmallest(TreeNode* root, int _k) {
        k = _k;
        dfs(root);
        return ans;
    }

    bool dfs(TreeNode* root) {                                   // 深度优先搜索
        if (!root) return false;
        if (dfs(root->left)) return true;
        if ( -- k == 0) {
            ans = root->val;
            return true;
        }
        return dfs(root->right);
    }
};
```


### 2. 二叉树的右视图（LeetCode 199 · Medium）

#### 题目

给定一个二叉树的根节点，想象自己站在它的右侧，按照从顶部到底部的顺序，返回从右侧所能看到的节点值。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/binary-tree-right-side-view/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2567/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/421980/)
- 题目详解：[[199-二叉树的右视图|打开完整题解]]

#### 解题思路

**核心思想：** 对二叉树做层序遍历，每层取最后一个节点放入结果集。

**为什么 BFS 适合？** BFS 天然按层处理，在每层遍历时很容易知道当前节点是不是该层的最后一个（判断 i 是否等于 q.size()-1 或 level_size-1）。思路非常直观，不容易出错。

#### 易错点
- **右视图不只看右子树：** 如果左子树比右子树深，底部的节点虽然在左子树但仍然能从右边看到（因为右子树没有挡住它）。所以不能只取右子树上的节点。
- **BFS 中 `q.size()` 必须固定：** `for i in range(q.size())` 中 `q.size()` 必须提前赋值给变量，否则会在循环中变化。
- **DFS 法的条件 `depth == len(res)`：** 只有首次到达某深度时才记录，后续再到达同一深度（从左子树来的）不记录。这个条件依赖 DFS 先走右子树的顺序。
- **空树处理：** 先判断 `if (!root) return {};`。

#### YXC 最终代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
 * };
 */
class Solution {
public:
    vector<int> rightSideView(TreeNode* root) {
        queue<TreeNode*> q;
        vector<int> res;
        if (!root) return res;
        q.push(root);                                            // 入队
        while (q.size()) {
            int len = q.size();
            for (int i = 0; i < len; i ++ ) {
                auto t = q.front();
                q.pop();                                         // 出队
                if (t->left) q.push(t->left);                    // 入队
                if (t->right) q.push(t->right);                  // 入队
                if (i == len - 1) res.push_back(t->val);         // 记录结果
            }
        }
        return res;
    }
};
```


### 3. 二叉树展开为链表（LeetCode 114 · Medium）

#### 题目

给你二叉树的根节点，请你将它展开为一个单链表。展开后的单链表应与二叉树前序遍历顺序相同。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/flatten-binary-tree-to-linked-list/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2476/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/390328/)
- 题目详解：[[114-二叉树展开为链表|打开完整题解]]

#### 解题思路

**核心思想：** 按照 **右→左→根** 的顺序（后序遍历变体）处理节点。用一个 `prev` 指针记录上一个处理完的节点。每处理一个节点，就把它的 `right` 指向 `prev`，`left` 置空。

**为什么用这个遍历顺序？** 前序遍历的顺序是「根→左→右」。如果按这个顺序正着处理，根节点的右指针需要指向左子树的根，但此时左子树还没处理完。如果我们反过来想——从最后一个节点开始往前串，前序遍历序列的最后一个节点是右子树的最右节点。按「右→左→根」的顺序处理，相当于从后往前构建链表。每处理一个节点，把它链接到已经处理好的「子链表」前面，这样当前节点就成了新的链表头。

#### 易错点
- **后序法的遍历顺序不是标准后序：** 标准后序是「左→右→根」，这里用的是「右→左→根」。目的是先处理序列末尾的节点，从后往前串联。
- **迭代法找到前驱后，要记得把左子树置空：** `cur->left = nullptr` 很容易忘记。不置空的话树结构没有被完全展开。
- **迭代法循环条件：** 循环条件是 `cur`（不断走 right），而不是 `cur.right`。因为展开过程中 cur.right 会变化。
- **后序法的 prev 指针初始为 nullptr：** 这样最后一个处理的节点（前序遍历的第一个节点，即根节点）的 right 会被置为 nullptr，符合要求。

#### YXC 最终代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    void flatten(TreeNode* root) {
        while (root) {
            auto p = root->left;
            if (p) {
                while (p->right) p = p->right;
                p->right = root->right;
                root->right = root->left;
                root->left = NULL;
            }
            root = root->right;
        }
    }
};
```


### 4. 从前序与中序遍历序列构造二叉树（LeetCode 105 · Medium）

#### 题目

给定两个整数数组 preorder 和 inorder，请构造二叉树并返回其根节点。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/construct-binary-tree-from-preorder-and-inorder-traversal/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2458/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/384035/)
- 题目详解：[[105-从前序与中序遍历构造二叉树|打开完整题解]]

#### 解题思路

**核心思想：**
1. 前序的第一个元素是根节点。
2. 在中序中找到根节点的位置，左边是左子树的中序，右边是右子树的中序。
3. 根据左子树的节点数，可以从前序中划分出左子树的前序和右子树的前序。
4. 递归构建左右子树。

**关键：** 用哈希表（字典）存储中序数组中每个值的索引，这样查找根节点在中序中的位置就是 O(1)。

#### 易错点
- **左子树大小的计算：** `left_size = in_idx - in_l`（中序中根的位置减左边界），然后用 left_size 来分割前序数组。
- **前序数组边界：** 左子树前序区间是 `[pre_l + 1, pre_l + left_size]`，右子树前序区间是 `[pre_l + left_size + 1, pre_r]`。注意 +1 和 -1 的边界细节。
- **递归的终止条件：** 当区间左边界 > 右边界时返回 nullptr，表示没有子节点。不是 `>=`，因为 `==` 时还有一个节点需要构建。
- **无重复值是前提：** 如果有重复值，哈希表映射会有歧义。题目保证无重复。
- **先构建左子树再构建右子树：** 前序的顺序是「根→左→右」，所以递归构建时也必须先左后右，这样才能和 pre_idx 指针的移动保持一致。

#### YXC 最终代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
 * };
 */
class Solution {
public:
    unordered_map<int, int> pos;                                 // 哈希表，O(1)查找

    TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {
        for (int i = 0; i < inorder.size(); i ++ ) pos[inorder[i]] = i;
        return build(preorder, inorder, 0, preorder.size() - 1, 0, inorder.size() - 1);
    }

    TreeNode* build(vector<int>& preorder, vector<int>& inorder, int pl, int pr, int il, int ir) {
        if (pl > pr) return NULL;
        auto root = new TreeNode(preorder[pl]);
        int k = pos[root->val];
        root->left = build(preorder, inorder, pl + 1, pl + 1 + k - 1 - il, il, k - 1);
        root->right = build(preorder, inorder, pl + 1 + k - 1 - il + 1, pr, k + 1, ir);
        return root;
    }
};
```


### 5. 路径总和 III（LeetCode 437 · Medium）

#### 题目

给定一个二叉树的根节点和一个整数 targetSum，求该二叉树里节点值之和等于 targetSum 的路径的数目。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/path-sum-iii/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2859/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/541434/)
- 题目详解：[[437-路径总和III|打开完整题解]]

#### 解题思路

**核心思想：** 在 DFS 遍历的过程中，维护从根节点到当前节点的路径和（前缀和 `cur_sum`）。用哈希表记录「前缀和 → 出现次数」。对于当前节点，`cur_sum - targetSum` 在前缀和中的出现次数，就是以当前节点结尾的满足条件的路径数。

**为什么能这样做？** 想象从根到当前节点的路径和为 S，如果存在一个祖先节点，从根到该祖先的路径和为 S - targetSum，那么从该祖先的下一个节点到当前节点的路径和就是 targetSum。这正是数组中「和为 K 的子数组」问题在树上的推广。

**为什么需要回溯？** 左右子树遍历完后，当前路径就不再存在了，必须把当前前缀和的计数减回去，否则其他分支会错误地使用这条路径的信息。

#### 易错点
- **`prefix[0] = 1` 的含义：** 表示「空路径的前缀和为 0 出现过一次」。这样当 `cur_sum == targetSum` 时，`prefix[cur_sum - targetSum] = prefix[0] = 1`，正确计数了从根节点到当前节点的路径。
- **回溯时必须 `prefix[cur_sum] -= 1`：** 如果忘记回溯，其他分支会错误地计入当前分支的前缀和。这是树上用前缀和最容易犯的错误（区别于数组上的前缀和不需要回溯）。
- **节点值可能为负数：** 双重递归法不能通过 `target - node.val == 0` 来终止递归，因为后面可能负数让和归零再变成 targetSum。
- **数值溢出：** 节点值范围 [-10^9, 10^9]，1000 个节点累加可能达到 ±10^12，C++ 无问题，但 C++/Java 需要用 long。
- **前缀和字典不要用 list 替代：** 因为需要的是「出现次数」的累加，不是位置索引。

#### YXC 最终代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    unordered_map<int, int> cnt;                                 // 哈希表，O(1)查找
    int res = 0;

    int pathSum(TreeNode* root, int sum) {
        cnt[0] ++ ;
        dfs(root, sum, 0);
        return res;
    }

    void dfs(TreeNode* root, int sum, int cur) {                 // 深度优先搜索
        if (!root) return;
        cur += root->val;
        res += cnt[cur - sum];  // 当前路径和 - target 的出现次数即为答案
        cnt[cur] ++ ;  // 记录当前前缀和
        dfs(root->left, sum, cur), dfs(root->right, sum, cur);
        cnt[cur] -- ;  // 回溯：移除当前前缀和
    }
};
```


### 6. 二叉树的最近公共祖先（LeetCode 236 · Medium）

#### 题目

给定一个二叉树，找到该树中两个指定节点的最近公共祖先。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2630/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/445172/)
- 题目详解：[[236-二叉树的最近公共祖先|打开完整题解]]

#### 解题思路

**核心思想：** 用后序遍历从底向上搜索。对每个节点，递归地在左右子树中查找 p 和 q：
- 如果左右子树都找到了（p 和 q 分布在左右两侧），当前节点就是 LCA。
- 如果只在一边找到了，返回找到的那一边的结果。
- 如果都没找到，返回 nullptr。

**为什么用后序？** 后序位置的特点是：**在决定当前节点是不是 LCA 之前，已经知道了左右子树中是否包含了 p 和 q**。这正是判断 LCA 所需要的——只有知道了左右子树的信息，才能判断当前节点是否是 p 和 q 的汇合点。

**代码理解：** 这段代码虽然只有几行，但非常精妙。它的核心逻辑是：
1. 如果 root 是 p 或 q，那 root 本身就可能是 LCA（如果另一个节点在 root 的子树中）。
2. 递归左右子树，看能找到什么。
3. 如果左右都返回非空，说明 p 和 q 分布两边，root 就是 LCA。
4. 如果只有一边非空，说明 p 和 q 都在那一边，返回那一侧找到的结果。

#### 易错点
- **p 或 q 本身就是 LCA 的情况：** 递归法中，如果 root 是 p，直接返回 p。此时如果 q 在左子树或右子树中，返回的 p 就是正确的 LCA。不需要继续递归。
- **后序位置的判断逻辑：** `left and right` 的意思是左右子树 **都找到了非空结果**。注意：这里的非空结果不一定是 p 或 q 本身，也可能是更低层找到的 LCA。
- **`return left or right` 的妙用：** C++ 中，如果 left 非空就返回 left，否则返回 right。用一行代码代替了 if-else 判断。
- **题目保证 p 和 q 存在：** 如果题目不保证 p 和 q 存在（实测中较少见），递归法需要额外处理。
- **节点值互不相同：** 题目保证值唯一，所以可以用值作为哈希表的键（但需要注意输入是节点引用）。

#### YXC 最终代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
 * };
 */
class Solution {
public:
    TreeNode* ans = NULL;

    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        dfs(root, p, q);
        return ans;
    }

    int dfs(TreeNode* root, TreeNode* p, TreeNode* q) {          // 深度优先搜索
        if (!root) return 0;
        int state = dfs(root->left, p, q);  // 递归搜索左子树
        if (root == p) state |= 1;  // 标记找到p(bit0)
        else if (root == q) state |= 2;  // 标记找到q(bit1)
        state |= dfs(root->right, p, q);
        if (state == 3 && !ans) ans = root;  // state=3即p和q都找到，当前为LCA
        return state;
    }
};
```


### 7. 二叉树中的最大路径和（LeetCode 124 · Hard）

#### 题目

路径被定义为一条从树中任意节点出发，沿父节点-子节点连接，达到任意节点的序列。给你一个二叉树的根节点，返回其最大路径和。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/binary-tree-maximum-path-sum/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2486/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/394504/)
- 题目详解：[[124-二叉树中的最大路径和|打开完整题解]]

#### 解题思路

**核心思想：** 每个节点可以计算两个值：
1. **经过当前节点的最大路径和** = `max(0, 左子树贡献) + node.val + max(0, 右子树贡献)`。这是「拐弯」路径，用于更新全局最大值。
2. **当前节点的单边最大贡献** = `node.val + max(max(0, 左子树贡献), max(0, 右子树贡献))`。这是「不拐弯」的路径，向上返回给父节点使用。父节点只能选择一条子树路径来延伸。

**为什么用后序？** 要计算「经过当前节点的路径和」，必须先知道左右子树的贡献值。这是典型的依赖子树信息的计算，必须用后序位置来操作。前序和中序都无法做到（进入节点时还不知道子树信息）。

#### 易错点
- **`max_sum` 初始化为负无穷：** 因为节点值可能全为负数，最大路径和可能是负数。如果初始化为 0，当所有路径和为负时会返回 0（错误）。必须用 `LLONG_MIN`。
- **舍弃负贡献：** `max(dfs(node.left), 0)` 中的 `max(..., 0)` 是核心——如果子树的贡献是负数，就不走那一边。这是路径和问题与直径问题最大的区别（直径不需要截断，因为深度总是非负）。
- **返回值和全局变量的区别：** 递归函数返回值是「单边最大贡献」（不能拐弯），全局变量 `max_sum` 记录「经过某个节点的最大路径和」（可以拐弯）。两者含义完全不同，不能混淆。
- **路径至少包含一个节点：** 即使所有节点值都是负数，也要选一个最大的负数作为结果，不能返回 0。所以 `max_sum` 的初始值必须是负无穷，保证至少能取到一个节点的值。
- **空节点返回 0，不是返回负无穷：** 空节点没有贡献，返回 0。如果把空节点返回负无穷，`max(负无穷, 0)` 会取 0，逻辑不对。

#### YXC 最终代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
 * };
 */
class Solution {
public:
    int ans;

    int maxPathSum(TreeNode* root) {
        ans = INT_MIN;                                           // 初始化为最小可能值
        dfs(root);
        return ans;
    }

    int dfs(TreeNode* u) {                                       // 深度优先搜索
        if (!u) return 0;
        int left = max(0, dfs(u->left)), right = max(0, dfs(u->right));  // 子树贡献为负则舍弃(取0)
        ans = max(ans, u->val + left + right);  // 经过当前节点的最大路径和（拐弯）
        return u->val + max(left, right);  // 向上返回单边最大贡献（不拐弯）
    }
};
```




## Day 8：图论 + 栈

### 1. 岛屿数量（LeetCode 200 · Medium）

#### 题目

给你一个由 '1'（陆地）和 '0'（水）组成的二维网格，请你计算网格中岛屿的数量。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/number-of-islands/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2568/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/421995/)
- 题目详解：[[200-岛屿数量|打开完整题解]]

#### 解题思路

**核心思想：** 遍历每个格子，遇到 `'1'` 就启动 DFS，把当前格子以及所有与其相连的 `'1'` 都标记为 `'0'`（沉岛），然后岛屿计数加 1。这样每个格子最多被访问一次。

为什么 DFS 可行？因为岛屿的形状不管多复杂，只要四方向相连都属于同一岛屿。DFS 可以沿着一条分支深入到底，再回溯探索其他分支，恰好覆盖整块相连区域。

**复杂度：** 时间 O(m×n)，空间 O(m×n)（最坏递归深度）

#### 易错点
- **边界越界：** 递归 DFS 时一定要先检查行列索引是否在有效范围内，否则会报 IndexError。
- **重复访问：** 必须及时标记已访问，避免死循环（上下左右来回走）。DFS 在调用递归前就应该标记，BFS 在入队时就要标记，不要等到出队时再标记。
- **递归深度爆栈：** 极端情况下（整个网格全是 `'1'`），DFS 递归深度可达 90,000 层，C++ 会 RecursionError。此时应改用 BFS 或手动设置 `sys.setrecursionlimit()`。
- **行列顺序：** `grid[i][j]` 中 i 是行号（纵坐标），j 是列号（横坐标），四方向遍历时注意 dx 对应行变化。
- **原地修改副作用：** 沉岛法会直接修改原输入数组，如果不允许修改原数组，需要额外 visited 矩阵。

#### YXC 最终代码
```cpp
class Solution {
public:
    vector<vector<char>> g;
    int dx[4] = {-1, 0, 1, 0}, dy[4] = {0, 1, 0, -1};

    int numIslands(vector<vector<char>>& grid) {
        g = grid;
        int cnt = 0;
        for (int i = 0; i < g.size(); i ++ )
            for (int j = 0; j < g[i].size(); j ++ )
                if (g[i][j] == '1') {
                    dfs(i, j);
                    cnt ++ ;
                }
        return cnt;
    }

    void dfs(int x, int y) {                                     // 深度优先搜索
        g[x][y] = '0';  // 沉岛：将'1'标记为'0'，避免重复访问
        for (int i = 0; i < 4; i ++ ) {
            int a = x + dx[i], b = y + dy[i];
            if (a >= 0 && a < g.size() && b >= 0 && b < g[a].size() && g[a][b] == '1')
                dfs(a, b);
        }
    }
};
```


### 2. 腐烂的橘子（LeetCode 994 · Medium）

#### 题目

给定一个 m x n 的网格，每分钟腐烂的橘子会向四个方向传播腐烂。返回直到网格中没有新鲜橘子为止所必须经过的最小分钟数。如果不可能全部腐烂，返回 -1。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/rotting-oranges/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/5733/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/2013561/)
- 题目详解：[[994-腐烂的橘子|打开完整题解]]

#### 解题思路

**核心思想：** 将所有初始腐烂橘子入队作为 BFS 的起点，然后进行标准的层序遍历。BFS 的层数就等于所需的分钟数。

为什么多源 BFS 可行？因为所有腐烂橘子是「同时」开始腐烂的，多源 BFS 天然模拟了这种同步扩散过程：每一层遍历对应一分钟，所有腐烂橘子在这一分钟同时向四周蔓延。

**复杂度：** 时间 O(m×n)，空间 O(m×n)

#### 易错点
- **新鲜橘子计数与 BFS 结束条件：** 在 BFS 过程中如果 `fresh == 0`，可以提前结束循环，避免不必要的遍历。但注意：最后一分钟的 BFS 结束后，fresh 可能刚好变为 0，此时 minutes 是正确答案。
- **同时腐烂 vs 逐次腐烂：** 必须用层序遍历 `for _ in range(q.size())` 来确保同一分钟所有腐烂橘子同步传播。如果不用层序遍历，就变成了每个腐烂橘子依次传播，分钟数会偏大。
- **永远无法腐烂的情况：** BFS 结束后仍存在新鲜橘子（fresh > 0），返回 -1。注意检查方式：可以在 BFS 后再次遍历，也可在 BFS 过程中用 fresh 计数器跟踪。
- **空单元格的隔离作用：** 值为 0 的空单元格会阻挡腐烂传播，腐烂橘子不能跳过空单元格感染另一侧的新鲜橘子。
- **初始状态无腐烂橘子：** 如果初始时没有腐烂橘子但有新鲜橘子，直接返回 -1（不可能腐烂）。

#### YXC 最终代码
```cpp
#define x first
#define y second

typedef pair<int, int> PII;

class Solution {
public:
    int orangesRotting(vector<vector<int>>& g) {
        int n = g.size(), m = g[0].size();
        queue<PII> q;
        for (int i = 0; i < n; i ++ )                            // 遍历
            for (int j = 0; j < m; j ++ )
                if (g[i][j] == 2)
                    q.push({i, j});                              // 入队

        int dx[] = {-1, 0, 1, 0}, dy[] = {0, 1, 0, -1};

        int res = -1;  // 初始化为-1：第一轮BFS扩散前记作第0分钟
        if (q.empty()) res = 0;  // 没有腐烂橘子时，0分钟
        while (q.size()) {
            res ++ ;  // 每层BFS代表1分钟
            int sz = q.size();
            while (sz -- ) {
                auto t = q.front();
                q.pop();                                         // 出队
                for (int i = 0; i < 4; i ++ ) {
                    int x = t.x + dx[i], y = t.y + dy[i];
                    if (x < 0 || x >= n || y < 0 || y >= m || g[x][y] != 1)
                        continue;
                    g[x][y] = 2;  // 新鲜橘子变腐烂
                    q.push({x, y});                              // 入队
                }
            }
        }

        for (int i = 0; i < n; i ++ )                            // 遍历
            for (int j = 0; j < m; j ++ )
                if (g[i][j] == 1)  // 还有新鲜橘子，不可能全腐烂
                    return -1;
        return res;
    }
};
```


### 3. 课程表（LeetCode 207 · Medium）

#### 题目

你这个学期必须选修 numCourses 门课程，先修课程按数组 prerequisites 给出。请你判断是否可能完成所有课程的学习。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/course-schedule/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2575/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/426294/)
- 题目详解：[[207-课程表|打开完整题解]]

#### 解题思路

**核心思想：** 把"先修关系"看成有向边，课程是节点。统计每门课的"入度"（需要先修的课程数量）。不断删除入度为 0 的课程（可以学的课），每删除一门课就把它指向的后续课程的入度减 1。如果最后所有课程都被删除了，说明无环。

为什么这个方法有效？入度为 0 意味着没有前置依赖，可以先学。学完之后它作为前置的影响就消失了，后续课程的依赖数减 1。这个过程不断重复，如果所有课程都能被"解放"，说明不存在循环依赖。

**复杂度：** 时间 O(V + E)，空间 O(V + E)

#### 易错点
- **入度方向：** 先修关系 `prerequisites[i] = [a_i, b_i]` 表示学 a_i 必须先学 b_i，即 **b_i → a_i** 的有向边。容易弄反方向导致建图错误。
- **孤立节点：** 有些课程可能没有任何先修关系（也不被任何课程需要），它们入度为 0，也应加入队列参与拓扑排序。
- **重复边：** 如果有重复的先修关系，入度会被重复计算导致拓扑排序提前终止。处理办法：建图前用 set 去重，或者建图时容忍重复（入度累加，但 Kahn 算法仍然正确，只是效率略低）。
- **提前退出优化：** 当 count == numCourses 时可以提前返回 true，不需要继续 BFS。
- **BFS 与 DFS 的选择：** 只需判环时两种方法均可。需要输出拓扑排序顺序时推荐用 Kahn 算法（对应题目 [210-课程表 II]）。

#### YXC 最终代码
```cpp
class Solution {
public:
    bool canFinish(int n, vector<vector<int>>& edges) {
        vector<vector<int>> g(n);
        vector<int> d(n);
        for (auto& e: edges) {
            int b = e[0], a = e[1];
            g[a].push_back(b);
            d[b] ++ ;
        }

        queue<int> q;
        for (int i = 0; i < n; i ++ )                            // 遍历
            if (d[i] == 0)
                q.push(i);                                       // 入队

        int cnt = 0;
        while (q.size()) {
            auto t = q.front();
            q.pop();                                             // 出队
            cnt ++ ;
            for (auto i : g[t])
                if ( -- d[i] == 0)
                    q.push(i);                                   // 入队
        }

        return cnt == n;
    }
};
```


### 4. 实现 Trie（前缀树）（LeetCode 208 · Medium）

#### 题目

Trie 是一种树形数据结构，用于高效地存储和检索字符串数据集中的键。实现 Trie 类，支持 insert、search 和 startsWith 操作。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/implement-trie-prefix-tree/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2576/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/426311/)
- 题目详解：[[208-实现Trie|打开完整题解]]

#### 解题思路

**核心思想：** 每个 Trie 节点包含一个字典 `children` 和一个布尔标志 `is_end`。`children` 的键是字符，值是下一个 Trie 节点。插入和查找都从根节点出发，沿着字符路径走。

#### 易错点
- **search vs startsWith 的区别：** `search` 要求精确匹配且 `is_end = true`；`startsWith` 只需要路径存在，**不需要 `is_end`**。这是最常见的 bug。
- **插入重复单词：** 重复插入同一单词时，第二次 insert 不会改变任何结构（路径已存在），但注意 `is_end` 已经为 true，无需再设。
- **空字符串处理：** 虽然题目没给空串，但如果你在根节点设置 `is_end = true`，相当于插入了空字符串，这会影响 search("") 的结果。
- **数组索引越界：** 使用数组实现时，必须确保字符在 'a'~'z' 范围内，`ord(ch) - ord('a')` 计算索引。如果字符集不保证是小写字母，用字典更安全。
- **子节点复用：** 插入 "app" 和 "apple" 时，"app" 路径会被两个单词共享。search("app") 依赖 `is_end` 判断，"apple" 的插入不会覆盖 "app" 的结尾标记。

#### YXC 最终代码
```cpp
class Trie {
public:
    struct Node {
        bool is_end;
        Node *son[26];
        Node() {
            is_end = false;
            for (int i = 0; i < 26; i ++ )
                son[i] = NULL;
        }
    }*root;

    /** Initialize your data structure here. */
    Trie() {
        root = new Node();
    }

    /** Inserts a word into the trie. */
    void insert(string word) {
        auto p = root;
        for (auto c: word) {
            int u = c - 'a';
            if (!p->son[u]) p->son[u] = new Node();
            p = p->son[u];
        }
        p->is_end = true;
    }

    /** Returns if the word is in the trie. */
    bool search(string word) {
        auto p = root;
        for (auto c: word) {
            int u = c - 'a';
            if (!p->son[u]) return false;
            p = p->son[u];
        }
        return p->is_end;
    }

    /** Returns if there is any word in the trie that starts with the given prefix. */
    bool startsWith(string word) {
        auto p = root;
        for (auto c: word) {
            int u = c - 'a';
            if (!p->son[u]) return false;
            p = p->son[u];
        }
        return true;
    }
};

/**
 * Your Trie object will be instantiated and called as such:
 * Trie* obj = new Trie();
 * obj->insert(word);
 * bool param_2 = obj->search(word);
 * bool param_3 = obj->startsWith(prefix);
 */
```


### 5. 有效的括号（LeetCode 20 · Easy）

#### 题目

给定一个只包括 '('、')'、'{'、'}'、'['、']' 的字符串，判断字符串是否有效。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/valid-parentheses/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2353/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/346874/)
- 题目详解：[[20-有效的括号|打开完整题解]]

#### 解题思路

**核心思想：** 遍历字符串，遇到左括号就入栈，遇到右括号就检查栈顶是否是对应的左括号。这利用了栈「后进先出」的特性：最后遇到的左括号需要最先被闭合。

**复杂度：** 时间 O(n)，空间 O(n)

#### 易错点
- **空栈访问：** 遇到右括号时，如果栈是空的（没有对应的左括号），直接返回 false。`not stack` 检查必不可少。
- **字符串遍历完后栈非空：** 如果有未闭合的左括号，如 `((()`，遍历完后栈不为空，说明无效。返回时应该检查 `not stack`。
- **不匹配顺序：** `([)]` 类型——每个左括号都有对应的右括号，但顺序不对。栈特性天然防止这种情况。
- **奇数长度优化：** 如果 `len(s) % 2 == 1`，直接返回 false，无需遍历。
- **多种括号类型：** 必须区分不同类型的括号，`(]` 不匹配。哈希映射可以有效处理这种对应关系。

#### YXC 最终代码
```cpp
class Solution {
public:
    bool isValid(string s) {
        stack<char> stk;
        unordered_map<char, char> pairs = {  // 右括号→左括号的映射
            {')', '('}, {']', '['}, {'}', '{'}
        };

        for (auto c : s) {
            if (!pairs.count(c)) {  // 左括号，入栈
                stk.push(c);                                     // 入栈
            } else {  // 右括号，检查栈顶是否匹配
                if (stk.size() && stk.top() == pairs[c])
                    stk.pop();                                   // 出栈
                else
                    return false;
            }
        }

        return stk.empty();  // 栈空说明所有括号都闭合了
    }
};
```


### 6. 最小栈（LeetCode 155 · Medium）

#### 题目

设计一个支持 push、pop、top 操作，并能在常数时间内检索到最小元素的栈。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/min-stack/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2536/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/411065/)
- 题目详解：[[155-最小栈|打开完整题解]]

#### 解题思路

**核心思想：** 使用两个栈：数据栈正常存储所有元素，辅助栈同步存储当前栈中的最小值。每次 push 时，辅助栈 push `min(val, 辅助栈栈顶)`；每次 pop 时两个栈同时 pop。

为什么辅助栈能记录最小值？因为栈是 LIFO 结构，辅助栈与数据栈同步操作，辅助栈的第 i 个元素就对应数据栈前 i 个元素中的最小值。

**复杂度：** 所有操作 O(1)，空间 O(n)

#### 易错点
- **辅助栈的初始值：** 辅助栈的第一个元素（对应数据栈为空时）应该设为 `inf` 或极大值，使得第一次 push 时 `min(val, inf)` 结果为 val。如果初始化为 0，当 val > 0 时最小值会错误地变成 0。
- **辅助栈同步操作：** pop 时必须两个栈同时 pop，否则辅助栈栈顶不再对应当前数据栈的最小值。常见的 bug 是数据栈 pop 了但忘记 pop 辅助栈。
- **重复最小值：** 当 push(1), push(1) 时，辅助栈中会存储两个 1。pop 一个后，辅助栈栈顶仍然是 1，最小值不变。这是正确的行为。
- **差值法的整数溢出：** C++ 不会溢出（大整数），但其他语言（C++/Java）中 `val - min_val` 可能溢出 int 范围。
- **getMin 在空栈时：** 题目保证不会在空栈时调用，但实际工程中需要处理。

#### YXC 最终代码
```cpp
class MinStack {
public:
    /** initialize your data structure here. */
    stack<int> stk, f;
    MinStack() {

    }

    void push(int x) {
        stk.push(x);                                             // 入栈
        if (f.empty() || f.top() >= x) f.push(x);
    }

    void pop() {
        if (stk.top() <= f.top()) f.pop();
        stk.pop();                                               // 出栈
    }

    int top() {
        return stk.top();
    }

    int getMin() {
        return f.top();
    }
};

/**
 * Your MinStack object will be instantiated and called as such:
 * MinStack* obj = new MinStack();
 * obj->push(x);
 * obj->pop();
 * int param_3 = obj->top();
 * int param_4 = obj->getMin();
 */
```


### 7. 字符串解码（LeetCode 394 · Medium）

#### 题目

给定一个经过编码的字符串，返回它解码后的字符串。编码规则为 k[encoded_string]。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/decode-string/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2779/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/503292/)
- 题目详解：[[394-字符串解码|打开完整题解]]

#### 解题思路

**核心思想：** 用两个变量 `cur_str` 和 `cur_num` 分别追踪当前正在构建的字符串和当前累积的数字。遇到 `[` 时，将当前状态入栈并重置；遇到 `]` 时，从栈中弹出状态并拼接结果。

**复杂度：** 时间 O(n)（n 为解码后字符串长度），空间 O(n)

#### 易错点
- **多位数处理：** 数字可能不止一位（如 `12[a]`），需要用 `cur_num = cur_num * 10 + int(ch)` 累积，而不是直接赋值。忘记处理多位数是最常见的 bug。
- **嵌套重置：** 遇到 `[` 时需要重置 `cur_str` 和 `cur_num`，否则内层会错误地继承外层的状态。
- **拼接顺序：** `prev_str + cur_str * num` — 外层的字符串应该在前，内层重复后的字符串在后。顺序搞反会导致结果错误（如 `3[a2[c]]` 会得到 "ca" × 3 而不是 "acc" × 3）。
- **栈的初始化：** 一开始栈是空的，遇到数字后累积，直到 `[` 才入栈。注意栈中的状态是 **入栈时的值**，不是出栈时再计算的。
- **字符串末尾无括号：** 如 `abc3[cd]xyz`，最后的 "xyz" 直接拼接到结果即可。

#### YXC 最终代码
```cpp
class Solution {
public:
    string decodeString(string s) {
        int u = 0;
        return dfs(s, u);
    }

    string dfs(string& s, int& u) {
        string res;
        while (u < s.size() && s[u] != ']') {
            if (s[u] >= 'a' && s[u] <= 'z' || s[u] >= 'A' && s[u] <= 'Z') res += s[u ++ ];
            else if (s[u] >= '0' && s[u] <= '9') {
                int k = u;
                while (s[k] >= '0' && s[k] <= '9') k ++ ;
                int x = stoi(s.substr(u, k - u));
                u = k + 1;
                string y = dfs(s, u);
                u ++ ; // 过滤掉右括号
                while (x -- ) res += y;
            }
        }
        return res;
    }
};
```




## Day 9：单调栈 + 堆

### 1. 每日温度（LeetCode 739 · Medium）

#### 题目

给定一个整数数组 temperatures，返回一个数组 answer，其中 answer[i] 是指对于第 i 天，下一个更高温度出现在几天后。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/daily-temperatures/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/3329/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/1006809/)
- 题目详解：[[739-每日温度|打开完整题解]]

#### 解题思路

**核心思想：** 维护一个单调递减栈（栈底 → 栈顶，温度越来越低）。遍历温度数组，当当前温度 > 栈顶温度时，说明栈顶温度遇到了右边第一个更高的温度，弹栈并计算结果。

为什么用栈？因为温度数组是按时间顺序的，后面的温度对前面的温度的影响是「后进先出」的——后面的低温先遇到后面的高温而解决，前面的低温要等更久。

**复杂度：** 时间 O(n)（每个元素最多入栈一次、出栈一次），空间 O(n)

#### 易错点
- **栈中存索引不是值：** 单调栈需要计算天数差（索引差值），所以栈中必须存索引。如果存温度值，就无法计算距离。
- **单调性方向：** 本题找「下一个更高温度」，维护的是 **单调递减栈**（栈底到栈顶递减）。如果找「下一个更小元素」则维护单调递增栈。保持方向正确很重要。
- **while 条件：** `temperatures[stack[-1]] < temperatures[i]` 用 `<` 还是 `<=`？本题严格大于才能算更高温度，相等不算，所以用 `<`。
- **结果数组初始化：** 所有位置默认值为 0，这样遇到没有更高温度的天数不需要额外处理。
- **连续相等值：** `[30, 30, 40]`，第 0 天和第 1 天温度相等，第 0 天要等到第 2 天（40），所以第 0 天的结果是 2。相等时不弹栈，因为相等不算更高温度。

#### YXC 最终代码
```cpp
class Solution {
public:
    vector<int> dailyTemperatures(vector<int>& T) {
        stack<int> stk;
        vector<int> res(T.size());
        for (int i = T.size() - 1; i >= 0; i -- ) {
            while (stk.size() && T[i] >= T[stk.top()]) stk.pop();  // 出栈
            if (stk.size()) res[i] = stk.top() - i;
            stk.push(i);                                         // 入栈
        }
        return res;
    }
};
```


### 2. 柱状图中最大的矩形（LeetCode 84 · Hard）

#### 题目

给定 n 个非负整数，用来表示柱状图中各个柱子的高度。求在该柱状图中，能够勾勒出来的矩形的最大面积。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/largest-rectangle-in-histogram/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2433/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/375419/)
- 题目详解：[[84-柱状图中最大的矩形|打开完整题解]]

#### 解题思路

**核心思想：** 维护一个单调递增栈（栈底到栈顶递增）。遍历高度数组，如果当前高度 < 栈顶高度，说明栈顶柱子找到了右边第一个更矮的柱子，可以弹栈计算面积了。

为什么用单调递增栈？因为我们要找的是「更矮」的柱子作为边界，而递增栈保证了栈中每个元素的下一个更矮元素就是当前要入栈的元素（如果它更矮的话）。

**复杂度：** 时间 O(n)，空间 O(n)

**为什么加哨兵 0？**
- 左边加 0：保证栈不会为空（0 始终在栈底），避免计算宽度时 `stack[-1]` 不存在。
- 右边加 0：保证最后栈中所有柱子都能被弹出计算（0 比所有正数都小）。

#### 易错点
- **哨兵 0 的作用：** 不加哨兵时，需要在 while 循环中检查栈是否为空；计算宽度时 `stack[-1]` 可能不存在。左右哨兵 0 避免了这些特殊情况。
- **宽度计算公式：** `w = i - stack[-1] - 1`。其中 `stack[-1]` 是弹出后新的栈顶（即左边第一个更矮柱子的索引），`i` 是右边第一个更矮柱子的索引。两者之间的柱子数（不包括它们自己）就是宽度。
- **while 条件是 `>` 还是 `>=`：** 使用 `>=` 或 `>` 会影响计算结果。因为相同高度的柱子，用 `>` 会保留左边的相同高度柱子作为边界，计算出的面积更准确。实际上用 `>=` 也可以，但需要保证一致性。
- **int 范围：** heights[i] 最大 10^4，长度最大 10^5，面积最大可达 10^9，在 32 位 int 范围内，但 C++ 不存在溢出问题。
- **柱子高为 0：** 高度为 0 的柱子无法贡献面积，但它会起到边界作用，分割左右两边的计算。

#### YXC 最终代码
```cpp
class Solution {
public:
    int largestRectangleArea(vector<int>& h) {
        int n = h.size();
        vector<int> left(n), right(n);
        stack<int> stk;

        for (int i = 0; i < n; i ++ ) {                          // 遍历
            while (stk.size() && h[stk.top()] >= h[i]) stk.pop();  // 出栈
            if (stk.empty()) left[i] = -1;
            else left[i] = stk.top();
            stk.push(i);                                         // 入栈
        }

        stk = stack<int>();
        for (int i = n - 1; i >= 0; i -- ) {
            while (stk.size() && h[stk.top()] >= h[i]) stk.pop();  // 出栈
            if (stk.empty()) right[i] = n;
            else right[i] = stk.top();
            stk.push(i);                                         // 入栈
        }

        int res = 0;
        for (int i = 0; i < n; i ++ ) {                          // 遍历
            res = max(res, h[i] * (right[i] - left[i] - 1));
        }

        return res;
    }
};
```


### 3. 数组中的第 K 个最大元素（LeetCode 215 · Medium）

#### 题目

给定整数数组 nums 和整数 k，请返回数组中第 k 个最大的元素。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/kth-largest-element-in-an-array/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2596/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/432564/)
- 题目详解：[[215-数组中的第K个最大元素|打开完整题解]]

#### 解题思路

**核心思想：** 维护一个大小为 k 的最小堆。遍历数组元素，将元素加入堆中；当堆大小 > k 时，弹出堆顶（当前最小的元素）。遍历结束后，堆顶就是第 k 大的元素。

为什么最小堆可以找到第 k 大？堆中始终保存着当前最大的 k 个元素，堆顶是这 k 个中最小的一即第 k 大的。

**复杂度：** 时间 O(n log k)，空间 O(k)。当 k << n 时非常高效。

#### 易错点
- **第 k 大 vs 第 k 小：** 第 k 大是从大到小排序后的第 k 个。如果使用从小到大排序，要取 `nums[n - k]`。快速选择中如果 partition 按大于 pivot 的放左边，则 pos 表示从大到小的排名（0-index）。
- **k 转换为 0-index：** 如果 partition 返回的是从大到小排序的 0-index 位置，需要将 k 减 1 再比较。
- **partition 方向一致性：** 分区时如果大于 pivot 的放左边，那么 partition 返回的 pos 就是该元素在从大到小排序中的位置。确保比较逻辑与此一致。
- **重复元素：** 有重复元素时 partition 可能不如预期稳定。例如 `[3,2,3,1,2,4,5,5,6]`，k=4，partition 时相等的元素可以放在左侧或右侧，不影响最终结果。
- **随机化的重要性：** 如果不随机选择 pivot，最坏情况（已排序数组）下快速选择会退化到 O(n²)。随机 pivot 能保证期望 O(n)。

#### YXC 最终代码
```cpp
class Solution {
public:

    int quick_sort(vector<int>& nums, int l, int r, int k) {
        if (l == r) return nums[k];
        int x = nums[l], i = l - 1, j = r + 1;
        while (i < j) {
            do i ++ ; while (nums[i] > x);
            do j -- ; while (nums[j] < x);
            if (i < j) swap(nums[i], nums[j]);
        }
        if (k <= j) return quick_sort(nums, l, j, k);
        else return quick_sort(nums, j + 1, r, k);
    }

    int findKthLargest(vector<int>& nums, int k) {
        return quick_sort(nums, 0, nums.size() - 1, k - 1);
    }
};
```


### 4. 前 K 个高频元素（LeetCode 347 · Medium）

#### 题目

给你一个整数数组 nums 和一个整数 k，请你返回其中出现频率前 k 高的元素。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/top-k-frequent-elements/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2736/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/487547/)
- 题目详解：[[347-前K个高频元素|打开完整题解]]

#### 解题思路

**核心思想：** 先用 `unordered_map` 统计每个数字的频率，然后构建一个大小为 k 的小根堆（按频率排序）。堆中始终保持当前频率最高的 k 个元素。

为什么用最小堆不是最大堆？因为我们要保留前 k 高的元素，用最小堆可以把堆顶（最小的频率）弹出，而较大的频率留在堆中。如果用最大堆，我们需要把所有元素都入堆，复杂度为 O(n log n)。

**复杂度：** 时间 O(n log k)，空间 O(n)

#### 易错点
- **堆中存储的是元组 (freq, num)：** 需要按频率排序，所以元组的第一个元素必须是频率。C++ 的 heap 默认按元组第一个元素排序。
- **最小堆保留的是高频元素：** 每次弹出的是堆顶（最小频率），最后堆中留下的就是频率最高的 k 个。不要把逻辑搞反。
- **桶排序的索引范围：** 频率最大为 n（所有元素相同），所以桶数组大小为 n+1（索引从 0 到 n）。频率 0 的桶永远为空。
- **频次统计：** C++ 直接用 `unordered_map<int, int>` 计数；注意遍历哈希表时顺序不固定。
- **结果的顺序：** 题目不要求顺序，所以直接返回列表即可。

#### YXC 最终代码
```cpp
class Solution {
public:
    vector<int> topKFrequent(vector<int>& nums, int k) {
        unordered_map<int, int> cnt;                             // 哈希表，O(1)查找
        for (auto x: nums) cnt[x] ++ ;
        int n = nums.size();
        vector<int> s(n + 1);
        for (auto [x, c]: cnt) s[c] ++ ;
        int i = n, t = 0;
        while (t < k) t += s[i -- ];  // 从高频往低频累加，找到第k个的边界
        vector<int> res;
        for (auto [x, c]: cnt)
            if (c > i)
                res.push_back(x);                                // 记录结果
        return res;
    }
};
```


### 5. 数据流的中位数（LeetCode 295 · Hard）

#### 题目

中位数是有序整数列表中的中间值。设计一个支持添加整数和返回中位数的数据结构。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/find-median-from-data-stream/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2669/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/456538/)
- 题目详解：[[295-数据流的中位数|打开完整题解]]

#### 解题思路

**核心思想：** 用两个堆：
- **大根堆 small（存负值模拟）：** 存储较小的一半元素，堆顶是这一半的最大值。
- **小根堆 large：** 存储较大的一半元素，堆顶是这一半的最小值。

维护两个堆的大小平衡（small 至少和 large 一样多），且 small 中所有元素 ≤ large 所有元素。

**复杂度：** addNum O(log n)，findMedian O(1)，空间 O(n)

#### 易错点
- **大根堆的模拟：** C++ 的 priority_queue 只提供小根堆，大根堆需要存负值来模拟。注意在使用 `small[0]` 时，取出的值需要取负才是真正的最大值。
- **堆的平衡条件：** 必须保证 `len(small) >= len(large)` 且 `len(small) - len(large) <= 1`。如果平衡条件不同，中位数的计算方式也要相应调整。
- **三步插入法的顺序：** `先入 small → 移最大值到 large → 平衡` 这三步的顺序不能错。如果跳步，可能导致 small 中的元素大于 large 中的元素，违反核心约束。
- **数据类型：** 当总数为偶数时，中位数可能是 `.5`，需要用 float 或 / 2.0 来计算。C++ 中 `/` 默认返回 float。
- **空堆处理：** 题目保证不会在空数据结构中查询中位数，但如果在工程中实现需要处理空值。

#### YXC 最终代码
```cpp
class MedianFinder {
public:
    priority_queue<int, vector<int>, greater<int>> up;
    priority_queue<int> down;

    /** initialize your data structure here. */
    MedianFinder() {

    }

    void addNum(int num) {
        if (down.empty() || num <= down.top()) {  // 插入大根堆（较小的一半）
            down.push(num);
            if (down.size() > up.size() + 1) {  // 平衡：大根堆最多比小根堆多1个
                up.push(down.top());
                down.pop();
            }
        } else {
            up.push(num);
            if (up.size() > down.size()) {  // 平衡：小根堆不能比大根堆多
                down.push(up.top());
                up.pop();
            }
        }
    }

    double findMedian() {
        if ((down.size() + up.size()) % 2) return down.top();
        return (down.top() + up.top()) / 2.0;
    }
};

/**
 * Your MedianFinder object will be instantiated and called as such:
 * MedianFinder* obj = new MedianFinder();
 * obj->addNum(num);
 * double param_2 = obj->findMedian();
 */
```




## Day 10：回溯

### 1. 全排列（LeetCode 46 · Medium）

#### 题目

给定一个不含重复数字的数组 nums，返回其所有可能的全排列。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/permutations/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2383/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/356268/)
- 题目详解：[[46-全排列|打开完整题解]]

#### 解题思路

**核心思想：** 标准的回溯算法，用 `visited` 数组标记已经选过的元素，每一层在"未使用"的元素中选择一个，递归到下一层。

每个叶子节点就是一个排列。

**算法流程：**
1. 初始化 `vector<vector<int>> res` 存放结果，`vector<bool> used(n, false)` 标记使用状态。
2. 定义回溯函数 `backtrack(path)`：
   - 如果 `len(path) == n`，找到一个排列，加入结果。
   - 遍历所有元素，跳过已使用的。
   - 标记当前元素已使用，将其加入路径。
   - 递归下一层。
   - 撤销选择：从路径中移除，取消标记。

#### 易错点
1. **引用传递问题**：`res.push_back(path[:])` 而不是 `res.push_back(path)`。`path` 在回溯过程中会被修改，如果不创建副本，最终 `res` 中所有元素都会指向同一个空列表。
2. **忘记撤销选择**：`used[i] = false` 和 `path.pop_back()` 必须成对出现。遗漏撤销会导致状态污染，使后续分支错误。
3. **数组越界**：当 `nums` 只有一个元素时，常规逻辑仍然正确，但要确保不出现 `nums[1]` 的访问。
4. **`used` 数组索引与 `nums` 索引的对应**：`used[i]` 标记的是 `nums[i]` 是否被使用，而不是具体的数值。

#### YXC 最终代码
```cpp
class Solution {
public:

    vector<vector<int>> ans;
    vector<int> path;
    vector<bool> st;

    vector<vector<int>> permute(vector<int>& nums) {
        path = vector<int>(nums.size());
        st = vector<bool>(nums.size());

        dfs(nums, 0);

        return ans;
    }

    void dfs(vector<int>& nums, int u) {                         // 深度优先搜索
        if (u == nums.size()) {
            ans.push_back(path);                                 // 记录结果
            return;
        }

        for (int i = 0; i < nums.size(); i ++ ) {                // 遍历
            if (st[i] == false) {
                path[u] = nums[i];
                st[i] = true;
                dfs(nums, u + 1);
                st[i] = false;
            }
        }
    }
};
```


### 2. 子集（LeetCode 78 · Medium）

#### 题目

给你一个整数数组 nums，数组中的元素互不相同。返回该数组所有可能的子集（幂集）。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/subsets/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2427/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/370434/)
- 题目详解：[[78-子集|打开完整题解]]

#### 解题思路

**核心思想：** 用二进制枚举表示每个元素选或不选。长度为 n 的数组，子集总数 = 2^n。从 0 到 2^n - 1 的每个二进制数，第 j 位为 1 表示选取 nums[j]。

**关键洞察：** 二进制枚举的简洁性在于——每个二进制数天然对应一个子集，不需要回溯、不需要撤销选择，代码极其简洁。

**核心推理：**
- 外层循环 `i` 从 0 到 `(1 << n) - 1`，枚举所有子集掩码。
- 内层循环 `j` 从 0 到 n-1，检查 `i` 的第 j 位是否为 1（`i >> j & 1`）。
- 如果为 1，将 `nums[j]` 加入当前子集。

**复杂度：** 时间 O(n × 2^n)，空间 O(1)（不计输出）

#### 易错点
1. **二进制枚举的范围：** 外层循环 `i` 从 0 到 `(1 << n) - 1`，注意 `1 << n` 可能溢出（n 最大 32 时 `1 << 31` 在 int 范围内，但 `1 << 32` 会溢出）。题目内 n 较小，不需担心。
2. **位运算优先级：** `i >> j & 1` 等价于 `(i >> j) & 1`，因为 `>>` 优先级高于 `&`。如果不确定可以加括号。
3. **空集自然包含：** 当 `i = 0` 时，所有位都为 0，path 为空，空集自然被加入结果，不需要特殊处理。
4. **与排列/组合的区别：** 二进制枚举只适用于"选或不选"的幂集问题。如果题目要求固定大小的子集，需要回溯法（如组合总和）。

#### YXC 最终代码
```cpp
class Solution {
public:
    vector<vector<int>> subsets(vector<int>& nums) {
        vector<vector<int>> res;
        int n = nums.size();
        for (int i = 0; i < 1 << n; i ++ ) {
            vector<int> path;
            for (int j = 0; j < n; j ++ )
                if (i >> j & 1)
                    path.push_back(nums[j]);
            res.push_back(path);                                 // 记录结果
        }

        return res;
    }
};
```


### 3. 电话号码的字母组合（LeetCode 17 · Medium）

#### 题目

给定一个仅包含数字 2-9 的字符串，返回所有它能表示的字母组合。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/letter-combinations-of-a-phone-number/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2350/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/346821/)
- 题目详解：[[17-电话号码的字母组合|打开完整题解]]

#### 解题思路

**核心思想：** 逐位处理每个数字，当前数字对应的每个字母都是一个分支。这是一个多叉树的遍历问题——每层的分支数取决于当前数字对应几个字母。

#### 易错点
1. **空输入处理**：`digits = ""` 应该返回 `[]` 而不是 `[""]`。需在开头做特判。
2. **数字与字符串混淆**：映射表的 key 是字符串 `'2'` 而不是整数 `2`，用 `digits[idx]` 获取的也是字符。
3. **回溯终止条件**：`idx == len(digits)` 时记录结果，此时 `path` 的长度也等于 `len(digits)`。
4. **数字 7 和 9 对应 4 个字母**：不要遗漏 7→pqrs 和 9→wxyz 的第 4 个字母。
5. **索引递增**：递归调用 `backtrack(idx + 1, ...)` 而不是 `backtrack(idx++, ...)` 或忘记递增。

#### YXC 最终代码
```cpp
class Solution {
public:
    vector<string> ans;
    string strs[10] = {
        "", "", "abc", "def",
        "ghi", "jkl", "mno",
        "pqrs", "tuv", "wxyz",
    };

    vector<string> letterCombinations(string digits) {
        if (digits.empty()) return ans;
        dfs(digits, 0, "");
        return ans;
    }

    void dfs(string& digits, int u, string path) {               // 深度优先搜索
        if (u == digits.size()) ans.push_back(path);             // 记录结果
        else {
            for (auto c : strs[digits[u] - '0'])
                dfs(digits, u + 1, path + c);
        }
    }
};
```


### 4. 组合总和（LeetCode 39 · Medium）

#### 题目

给你一个无重复元素的整数数组 candidates 和一个目标整数 target，找出 candidates 中可以使数字和为目标数 target 的所有不同组合。candidates 中的同一个数字可以无限制重复被选取。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/combination-sum/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2376/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/355108/)
- 题目详解：[[39-组合总和|打开完整题解]]

#### 解题思路

**核心思想：** 先排序，然后用回溯法逐个选取元素。每次可以从当前及之后的元素中选择（可重复选当前），当累计和超过 target 时剪枝。

#### 易错点
1. **`start` 参数传 `i` 还是 `i+1`**：本题允许重复选取同一元素，所以递归传 `i`（还能选自己）；如果不允许重复则传 `i+1`（如 40-组合总和 II）。
2. **剪枝条件用 `break` 还是 `continue`**：排序后用 `break`，因为后面的元素更大，一定都会超；不排序则只能用 `continue`。
3. **`remaining` 的计算**：`remaining - candidates[i]` 作为参数传入，不要在函数体内修改外部变量。
4. **没有排序就跳出的风险**：如果不排序就使用 `break` 剪枝，会遗漏正确结果。例如 `[3,2,5]`，target=5，遇到 3<5 就 break 会跳过 [5]。
5. **结果去重**：必须使用 `start` 参数，否则会出现 `[2,2,3]` 和 `[2,3,2]` 这样的重复组合。

#### YXC 最终代码
```cpp
class Solution {
public:

    vector<vector<int>> ans;
    vector<int> path;

    vector<vector<int>> combinationSum(vector<int>& c, int target) {
        dfs(c, 0, target);
        return ans;
    }

    void dfs(vector<int>& c, int u, int target) {                // 深度优先搜索
        if (target == 0) {
            ans.push_back(path);                                 // 记录结果
            return;
        }
        if (u == c.size()) return;

        for (int i = 0; c[u] * i <= target; i ++ ) {  // 枚举c[u]取0,1,2,...个
            dfs(c, u + 1, target - c[u] * i);
            path.push_back(c[u]);
        }

        for (int i = 0; c[u] * i <= target; i ++ ) {
            path.pop_back();                                     // 回溯：撤销选择
        }
    }
};
```


### 5. 括号生成（LeetCode 22 · Medium）

#### 题目

数字 n 代表生成括号的对数，请你设计一个函数，用于能够生成所有可能的并且有效的括号组合。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/generate-parentheses/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2355/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/347825/)
- 题目详解：[[22-括号生成|打开完整题解]]

#### 解题思路

**核心思想：** 维护已使用的左括号数 `left` 和右括号数 `right`。每一步有两种选择——放左括号或放右括号，但受以下约束：
- 只有在 `left < n` 时才能放左括号。
- 只有在 `right < left` 时才能放右括号（右括号不能多于左括号）。

#### 易错点
1. **右括号的约束条件写错**：`right < left`（已使用角度）或 `right_rem > left_rem`（剩余角度）。如果写成 `right <= left`，就会在 `right == left` 时允许放右括号，产生无效的 `())` 序列。
2. **忘记字符串的不可变性**：C++ 中字符串是不可变的，`path + '('` 产生新字符串，无需显式撤销。如果使用列表 `path.push_back` 则需要 `path.pop` 撤销。
3. **初始调用**：`backtrack(0, 0, '')` 不能以右括号开始，约束自然阻止了这种情况。
4. **n 的边界**：n=1 时正确输出 `["()"]`，n=0 时（虽然题目给出 n>=1）应返回 `[""]`。

#### YXC 最终代码
```cpp
class Solution {
public:

    vector<string> ans;

    vector<string> generateParenthesis(int n) {
        dfs(n, 0, 0, "");
        return ans;
    }

    void dfs(int n, int lc, int rc, string seq) {                // 深度优先搜索
        if (lc == n && rc == n) ans.push_back(seq);              // 记录结果
        else {
            if (lc < n) dfs(n, lc + 1, rc, seq + '(');
            if (rc < n && lc > rc) dfs(n, lc, rc + 1, seq + ')');
        }
    }
};
```


### 6. 单词搜索（LeetCode 79 · Medium）

#### 题目

给定一个 m x n 二维字符网格和一个字符串单词，如果单词存在于网格中，返回 true。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/word-search/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2428/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/370446/)
- 题目详解：[[79-单词搜索|打开完整题解]]

#### 解题思路

**核心思想：** 从每个格子出发，进行深度优先搜索（DFS）。用 `#` 临时覆盖格子值来标记已访问（省去 visited 数组），回溯时恢复。

**搜索路径可视化（以 board=[["A","B","C"],["S","F","C"],["A","D","E"] ], word="ABC" 为例）：**

#### 易错点
1. **忘记回溯还原**：标记 visited 后必须在返回前恢复，否则其他起点无法使用该格子。这是网格回溯最常见的问题。
2. **四方向顺序优化**：先搜索最可能的方向（虽然没有通用规则），但短路或 `or` 天然带剪枝——找到一个就返回。
3. **索引越界检查顺序**：必须先检查越界再访问 board。写成 `board[i][j] != word[k] or 越界` 会先下标越界报错。
4. **早期剪枝遗漏**：如果 word 长度 > m x n，直接返回 false。这是简单有效的早期剪枝。
5. **C++ 字符串不可变性**：`board[i][j] = '#'` 直接修改原列表是允许的（列表可变的），但要确保恢复。

#### YXC 最终代码
```cpp
class Solution {
public:
    bool exist(vector<vector<char>>& board, string word) {
        for (int i = 0; i < board.size(); i ++ ) {
            for (int j = 0; j < board[i].size(); j ++ ) {
                if (dfs(board, word, 0, i, j)) return true;
            }
        }
        return false;
    }

    int dx[4] = {-1, 0, 1, 0}, dy[4] = {0, 1, 0, -1};

    bool dfs(vector<vector<char>>& board, string& word, int u, int x, int y) { // 深度优先搜索
        if (board[x][y] != word[u]) return false;
        if (u == word.size() - 1) return true;

        char t = board[x][y];
        board[x][y] = '.';
        for (int i = 0; i < 4; i ++ ) {
            int a = x + dx[i], b = y + dy[i];
            if (a < 0 || a >= board.size() || b < 0 || b >= board[0].size() || board[a][b] == '.') continue;
            if (dfs(board, word, u + 1, a, b)) return true;
        }
        board[x][y] = t;
        return false;
    }
};
```


### 7. 分割回文串（LeetCode 131 · Medium）

#### 题目

给你一个字符串 s，请你将 s 分割成一些子串，使每个子串都是回文串。返回 s 所有可能的分割方案。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/palindrome-partitioning/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2501/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/400664/)
- 题目详解：[[131-分割回文串|打开完整题解]]

#### 解题思路

**核心思想：** 把问题看作"在字符串上选择切割点"。每次切割时判断当前子串是否为回文，如果是则继续切割剩余部分。先预处理所有子串的回文状态，让判断 O(1)。

**DP 回文预处理思路：**
- `dp[i][j]` 表示 `s[i:j+1]` 是否为回文。
- 递推：`s[i]==s[j] and (j-i<=2 or dp[i+1][j-1])`。
- 从下往上、从左往右遍历。

#### 易错点
1. **切割点枚举范围**：`range(start, n)` 中 `end` 从 start 到 n-1，表示子串 `s[start:end+1]`。越界是常见错误。
2. **递归参数更新**：切割完当前子串后，下一个 start 是 `end + 1`，而不是 `end`。传错会导致无限递归或重复切割。
3. **DP 数组遍历顺序**：`dp[i][j]` 依赖 `dp[i+1][j-1]`（左下角），所以必须从下往上、从左往右遍历。顺序错了结果全错。
4. **单个字符的处理**：`j - i <= 2` 包含了 `j-i==0`（单字符）和 `j-i==1`（双字符相同），这两个都是回文。不要漏掉 `j-i==1` 的情况。
5. **slicing 效率**：`s[start:end+1]` 创建新子串，O(k) 时间。如果十分在意性能，可以传 start 和 end 索引到最终再切。

#### YXC 最终代码
```cpp
class Solution {
public:
    vector<vector<bool>> f;
    vector<vector<string>> ans;
    vector<string> path;

    vector<vector<string>> partition(string s) {
        int n = s.size();
        f = vector<vector<bool>>(n, vector<bool>(n));
        for (int j = 0; j < n; j ++ )
            for (int i = 0; i <= j; i ++ )
                if (i == j) f[i][j] = true;  // 单个字符是回文
                else if (s[i] == s[j]) {  // 首尾相等且内部也是回文
                    if (i + 1 > j - 1 || f[i + 1][j - 1]) f[i][j] = true;  // 长度≤2或内部子串是回文
                }

        dfs(s, 0);
        return ans;
    }

    void dfs(string& s, int u) {                                 // 深度优先搜索
        if (u == s.size()) ans.push_back(path);                  // 记录结果
        else {
            for (int i = u; i < s.size(); i ++ )
                if (f[u][i]) {
                    path.push_back(s.substr(u, i - u + 1));
                    dfs(s, i + 1);
                    path.pop_back();                             // 回溯：撤销选择
                }
        }
    }
};
```


### 8. N 皇后（LeetCode 51 · Hard）

#### 题目

n 皇后问题研究的是如何将 n 个皇后放置在 n×n 的棋盘上，并且使皇后彼此之间不能互相攻击。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/n-queens/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2396/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/362151/)
- 题目详解：[[51-N皇后|打开完整题解]]

#### 解题思路

**核心思想：** 逐行放置皇后。用三个集合分别记录"已被占用的列"、"已被占用的主对角线（row - col）"、"已被占用的副对角线（row + col）"。每行在可选列中选择，放置后递归下一行。

**对角线特征解释：**
- 主对角线（左上→右下）：`row - col` 为常数，数组下标可加 `n` 偏移。
- 副对角线（右上→左下）：`row + col` 为常数。

**复杂度：** 时间 O(n!)，空间 O(n²)

#### 易错点
1. **对角线公式混淆**：主对角线是 `row - col`（常数），副对角线是 `row + col`（常数）。把两个搞混会导致错误的冲突判断。
2. **负数索引问题**：在集合版本中 `row - col` 可能是负数，但 C++ 的 set 可以存储负数，这是集合版本比数组版本简单的地方。数组版本需要加偏移 `row - col + n - 1`。
3. **路径拷贝**：`res.push_back([''.join(r) for r in path])` 中 `path` 的每一行是列表，需要转换为字符串并创建新列表，避免后续被修改。
4. **n=1 边界**：只有一个格子，放一个皇后，结果是 `"Q"`。代码应正确处理。
5. **对称性未利用**：n 皇后问题的解通常有对称性，但标准解法不需要利用这个性质。面试时提到这一点可以加分。

#### YXC 最终代码
```cpp
class Solution {
public:

    int n;
    vector<bool> col, dg, udg;
    vector<vector<string>> ans;
    vector<string> path;

    vector<vector<string>> solveNQueens(int _n) {
        n = _n;
        col = vector<bool>(n);
        dg = udg = vector<bool>(n * 2);  // dg:主对角线, udg:副对角线
        path = vector<string>(n, string(n, '.'));

        dfs(0);
        return ans;
    }

    void dfs(int u) {                                            // 深度优先搜索
        if (u == n) {
            ans.push_back(path);                                 // 记录结果
            return;
        }

        for (int i = 0; i < n; i ++ ) {                          // 遍历
            if (!col[i] && !dg[u - i + n] && !udg[u + i]) {  // 主对角线特征：row-col为常数
                col[i] = dg[u - i + n] = udg[u + i] = true;  // 主对角线特征：row-col为常数
                path[u][i] = 'Q';
                dfs(u + 1);
                path[u][i] = '.';
                col[i] = dg[u - i + n] = udg[u + i] = false;  // 主对角线特征：row-col为常数
            }
        }
    }
};
```




## Day 11：二分查找

### 1. 搜索插入位置（LeetCode 35 · Easy）

#### 题目

给定一个排序数组和一个目标值，在数组中找到目标值并返回其索引。如果目标值不存在，返回它将会被按顺序插入的位置。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/search-insert-position/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2372/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/355047/)
- 题目详解：[[35-搜索插入位置|打开完整题解]]

#### 解题思路

**核心思想：** 维护 `[left, right]` 闭区间，每次排除一半不可能的区域。循环结束时，`left` 就是第一个 >= target 的位置。

**关键洞察：** 当 `nums[mid] < target` 时，mid 及左侧都 < target，一定能被排除，所以 `left = mid + 1`；否则（`nums[mid] >= target`），mid 可能是答案，所以 `right = mid - 1`，但 `left` 不会越过这个位置。

**搜索过程可视化（以 nums=[1,3,5,6], target=2 为例）：**

#### 易错点
1. **区间不变量搞混**：使用 `left <= right`（闭区间）时，更新为 `mid + 1` / `mid - 1`；使用 `left < right`（开区间）时，更新方式不同。统一使用一种风格避免混淆。
2. **返回 `left` 还是 `right`**：循环结束时，`left` 是第一个 >= target 的位置；`right` 是 `left - 1`。要注意返回的是 `left`。
3. **越界风险**：`mid = (left + right) // 2` 在 left+right 很大时可能溢出，用 `left + (right - left) // 2` 更安全。
4. **死循环**：当 `left == right` 时，如果更新逻辑不恰当（例如 `left = mid` 而不是 `mid + 1`），可能出现死循环。使用 `left <= right` 闭区间的风格，配合 `mid +/- 1` 的更新，不会死循环。
5. **插入末尾**：如果 target 大于所有元素，最终 `left = len(nums)`，这就是插入到末尾的位置，不能越界访问 `nums[left]`。

#### YXC 最终代码
```cpp
class Solution {
public:
    int searchInsert(vector<int>& nums, int target) {
        int l = 0, r = nums.size();

        while (l < r) {
            int mid = l + r >> 1;
            if (nums[mid] >= target) r = mid;
            else l = mid + 1;
        }

        return l;
    }
};
```


### 2. 搜索二维矩阵（LeetCode 74 · Medium）

#### 题目

编写一个高效的算法来判断 m x n 矩阵中是否存在一个目标值。该矩阵每行升序，且每行的第一个整数大于前一行的最后一个整数。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/search-a-2d-matrix/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2423/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/370359/)
- 题目详解：[[74-搜索二维矩阵|打开完整题解]]

#### 解题思路

**核心思想：** 把 `m x n` 的矩阵看作长度为 `m x n` 的一维有序数组。通过数学映射在 O(log(mn)) 时间内完成查找。

**映射关系：**
- 一维索引 `mid` → 二维坐标 `(row, col)`：
  - `row = mid // n`
  - `col = mid % n`

**可视化（以 3x4 矩阵为例，展平后索引对应关系）：**

#### 易错点
1. **矩阵为空**：`matrix = []` 或 `matrix = [[]]` 时需提前返回 false。
2. **一维展开时的列数 n**：`mid // n` 和 `mid % n` 中的 n 是列数（不是行数），写反会导致完全错误的坐标。
3. **两次二分中"找行"的边界**：`bottom` 指向最后一行首元素 <= target 的行。如果 `bottom < 0`，说明 target 比所有行的首元素都小，直接返回 false。
4. **索引从 0 开始**：一维索引范围是 `[0, m*n-1]`，`right = m * n - 1` 是正确的，不要写成 `m * n`。
5. **列数为 1 的情况**：`n = 1` 时，`mid % 1 = 0`，此时矩阵退化为列向量，二分仍然正确。

#### YXC 最终代码
```cpp
class Solution {
public:
    bool searchMatrix(vector<vector<int>>& matrix, int target) {
        if (matrix.empty() || matrix[0].empty()) return false;
        int n = matrix.size(), m = matrix[0].size();

        int l = 0, r = n * m - 1;
        while (l < r) {
            int mid = l + r >> 1;
            if (matrix[mid / m][mid % m] >= target) r = mid;
            else l = mid + 1;
        }

        return matrix[r / m][r % m] == target;
    }
};
```


### 3. 在排序数组中查找元素的第一个和最后一个位置（LeetCode 34 · Medium）

#### 题目

给定一个按照非递减顺序排列的整数数组和一个目标值，找出目标值在数组中的开始位置和结束位置。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2371/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/355034/)
- 题目详解：[[34-在排序数组中查找元素首末位置|打开完整题解]]

#### 解题思路

**核心思想：** 分别用两个二分查找函数找左边界和右边界。
- **左边界（lower_bound）**：找第一个 >= target 的位置。`nums[mid] < target` 时排除左半，否则排除右半。
- **右边界（upper_bound）**：找最后一个 <= target 的位置。`nums[mid] <= target` 时排除左半，否则排除右半。
- 或者找第一个 > target 的位置，然后减 1 得到右边界。

**搜索过程可视化（以 nums=[5,7,7,8,8,10], target=8 为例）：**

#### 易错点
1. **左边界模板的 `if` 条件区别**：
   - 左边界：`nums[mid] < target` → `l = mid + 1`
   - 右边界：`nums[mid] <= target` → `l = mid + 1`
   - 仅仅是一个等号的差别！等号在哪边决定了是找左边界还是右边界。
2. **验证逻辑**：必须检查 `left >= len(nums)`（越界）或 `nums[left] != target`（值不存在），二者任一成立则返回 [-1, -1]。
3. **空数组**：`len(nums) == 0` 时 `lower_bound()` 返回 0，检查 `left >= len(nums)` 时触发，返回 [-1, -1]。
4. **右边界用 `left_bound` 加等号的技巧**：如果记不住右边界模板，可以用"找第一个 > target 的位置，减 1 得右边界"代替。即 `lower_bound_right(nums, target) - 1`。
5. **死循环**：在 `while l <= r` 的写法中，每次更新为 `mid +/- 1`，不会死循环。但如果用 `while l < r` 需要特别注意 `mid` 的取值方式。

#### YXC 最终代码
```cpp
class Solution {
public:
    vector<int> searchRange(vector<int>& nums, int target) {
        if (nums.empty()) return {-1, -1};

        int l = 0, r = nums.size() - 1;
        while (l < r) {
            int mid = l + r >> 1;
            if (nums[mid] >= target) r = mid;
            else l = mid + 1;
        }

        if (nums[r] != target) return {-1, -1};

        int L = r;
        l = 0, r = nums.size() - 1;
        while (l < r) {
            int mid = l + r + 1 >> 1;
            if (nums[mid] <= target) l = mid;
            else r = mid - 1;
        }

        return {L, r};
    }
};
```


### 4. 搜索旋转排序数组（LeetCode 33 · Medium）

#### 题目

整数数组 nums 按升序排列，在预先未知的某个下标上进行了旋转。给你旋转后的数组和一个目标值，如果存在则返回下标，否则返回 -1。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/search-in-rotated-sorted-array/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2370/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/355022/)
- 题目详解：[[33-搜索旋转排序数组|打开完整题解]]

#### 解题思路

**核心思想：** 每次二分时，通过比较 `nums[left]` 和 `nums[mid]` 确定当前哪一段有序，然后判断 target 是否在有序段内。

**算法流程：**
1. 计算 mid。
2. 如果 `nums[mid] == target`，返回 mid。
3. **判断哪段有序**：`nums[left] <= nums[mid]` 则左半有序，否则右半有序。
4. **判断 target 是否在有序段内**：
   - 左半有序且 `nums[left] <= target < nums[mid]`：target 在左半，收缩右边界。
   - 左半有序但 target 不在左半范围：去右半找，收缩左边界。
   - 右半有序同理。

**搜索过程可视化（以 nums=[4,5,6,7,0,1,2], target=0 为例）：**

#### 易错点
1. **判断有序段的条件**：`nums[left] <= nums[mid]` 中的等号不能省略。当 `left == mid` 时（区间缩小到两个元素），等号保证正确判断。
2. **target 在有序段内的判断**：注意边界——如果 target 在左半有序段，条件是 `nums[left] <= target < nums[mid]`（右开，排除 mid 自身，因为 mid 已经不等于 target 了）。
3. **区间收缩方向**：初学者容易把 left/right 的更新方向搞反。记住："target 在一段，就缩到这一段；不在，就去另一段。"
4. **重复元素问题**：如果数组有重复元素（81 题），`nums[left] == nums[mid]` 时无法判断哪段有序，需要 `left += 1` 跳过。
5. **pivot 思路中的边界**：当 pivot == 0 时（数组实际上没有旋转），`nums[pivot] <= target <= nums[-1]` 覆盖了整个数组。

#### YXC 最终代码
```cpp
class Solution {
public:
    int search(vector<int>& nums, int target) {
        if (nums.empty()) return -1;
        int l = 0, r = nums.size() - 1;
        while (l < r) {
            int mid = l + r + 1 >> 1;
            if (nums[mid] >= nums[0]) l = mid;  // mid在左半段（大段），向右找旋转点
            else r = mid - 1;
        }

        if (target >= nums[0]) l = 0;
        else l = r + 1, r = nums.size() - 1;  // 确定target所在的有序区间

        while (l < r) {
            int mid = l + r >> 1;
            if (nums[mid] >= target) r = mid;
            else l = mid + 1;
        }

        if (nums[r] == target) return r;
        return -1;
    }
};
```


### 5. 寻找旋转排序数组中的最小值（LeetCode 153 · Medium）

#### 题目

已知一个长度为 n 的数组，预先按照升序排列，经由多次旋转后得到输入数组。找出并返回数组中的最小元素。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/find-minimum-in-rotated-sorted-array/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2534/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/411020/)
- 题目详解：[[153-寻找旋转排序数组中的最小值|打开完整题解]]

#### 解题思路

**核心思想：** 维护搜索区间 `[left, right)` 左闭右开。比较 `nums[mid]` 和 `nums[right]`（不是 left！）决定搜索方向。

**算法流程：**
1. 初始化 `left, right = 0, len(nums) - 1`。
2. 当 `left < right` 时循环：
   - `mid = left + (right - left) // 2`
   - 如果 `nums[mid] > nums[right]`：最小值在右半，`left = mid + 1`。
   - 如果 `nums[mid] < nums[right]`：最小值在左半（包含 mid），`right = mid`。
3. 循环结束时，`left == right`，返回 `nums[left]`。

**为什么和 nums[right] 比较而不是 nums[left]：**
- 最小值必定在"断点"处，而断点的特点是左侧元素都大于右侧所有元素。
- `nums[mid] > nums[right]` 意味着 mid 在断点的左侧（大段），收缩左边界。
- `nums[mid] < nums[right]` 意味着 mid 在断点的右侧（小段），收缩右边界。

**搜索过程可视化（以 nums=[4,5,6,7,0,1,2] 为例）：**

#### 易错点
1. **循环条件用 `left < right` 而不是 `<=`**：因为当 `left == right` 时就找到了最小值，循环应该停止。如果用 `<=` 会陷入死循环。
2. **`nums[mid] > nums[right]` 时 `left = mid + 1`**：因为 mid 在大段，mid 本身不可能是最小值，可以跳过。
3. **`nums[mid] < nums[right]` 时 `right = mid`**：因为 mid 可能在小段且可能就是最小值，所以不能跳过（不能 `mid - 1`）。
4. **不是和 `nums[left]` 比较**：如果和 `nums[left]` 比较，`nums[mid] > nums[left]` 无法区分 mid 在大段还是小段（因为小段也可能大于 left）。和 `nums[right]` 比较才能正确判断。
5. **降序数组特例**：虽然题目保证原数组是升序排列的，但如果考虑所有情况，升序旋转 + 无重复是最安全的条件。

#### YXC 最终代码
```cpp
class Solution {
public:
    int findMin(vector<int>& nums) {
        int l = 0, r = nums.size() - 1;
        if (nums[r] >= nums[l]) return nums[0];
        while (l < r) {
            int mid = l + r >> 1;
            if (nums[mid] < nums[0]) r = mid;
            else l = mid + 1;
        }
        return nums[r];
    }
};
```


### 6. 寻找两个正序数组的中位数（LeetCode 4 · Hard）

#### 题目

给定两个大小分别为 m 和 n 的正序数组，找出并返回这两个正序数组的中位数。时间复杂度 O(log(m+n))。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/median-of-two-sorted-arrays/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2329/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/339893/)
- 题目详解：[[4-寻找两个正序数组的中位数|打开完整题解]]

#### 解题思路

**核心思想：**
- 在较短的数组上确定一个分割点 i，使得 nums1 的前 i 个元素 + nums2 的前 j 个元素 = 总元素数的一半。
- 其中 j = (m+n+1)//2 - i。
- 分割线是否合法：`nums1[i-1] <= nums2[j]` 且 `nums2[j-1] <= nums1[i]`。
- 如果不合法，根据比较结果调整 i。

**可视化（以 nums1=[1,3,5,7], nums2=[2,4,6,8] 为例）：**

**处理边界：**
- 当 i = 0 时，nums1 左半没有元素，用 -inf 表示左边最大值。
- 当 i = m 时，nums1 右半没有元素，用 +inf 表示右边最小值。
- j 同理。

#### 易错点
1. **边界值处理**：分割线在数组两端时，用 `-inf` 和 `+inf` 表示是优雅的处理方式。忘记处理边界会导致索引越界。
2. **总元素数奇偶性**：奇数时中位数是左半最大值，偶数时是左右半的平均值。要把两种情况都考虑到。
3. **分割线位置 i 的范围**：`i` 在 `[0, m]` 范围内（包括 0 和 m），对应的 j 由 `total_left - i` 计算。需要确保 `0 <= j <= n`，这依赖于 `nums1` 是短数组。
4. **死循环**：在二分 i 的过程中，当 `i` 需要调整时，必须用 `mid +/- 1` 更新，不能直接用 `mid`，否则可能死循环。
5. **`total_left` 的计算**：`(m+n+1)//2` 中的 `+1` 是为了在总数为奇数时让左半多一个元素，这样中位数就是左半最大值。

#### YXC 最终代码
```cpp
class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        int tot = nums1.size() + nums2.size();
        if (tot % 2 == 0) {
            int left = find(nums1, 0, nums2, 0, tot / 2);
            int right = find(nums1, 0, nums2, 0, tot / 2 + 1);
            return (left + right) / 2.0;
        } else {
            return find(nums1, 0, nums2, 0, tot / 2 + 1);
        }
    }

    int find(vector<int>& nums1, int i, vector<int>& nums2, int j, int k) {
        if (nums1.size() - i > nums2.size() - j) return find(nums2, j, nums1, i, k);
        if (k == 1) {
            if (nums1.size() == i) return nums2[j];
            else return min(nums1[i], nums2[j]);
        }
        if (nums1.size() == i) return nums2[j + k - 1];
        int si = min((int)nums1.size(), i + k / 2), sj = j + k - k / 2;
        if (nums1[si - 1] > nums2[sj - 1])
            return find(nums1, i, nums2, sj, k - (sj - j));
        else
            return find(nums1, si, nums2, j, k - (si - i));
    }
};
```




## Day 12：动态规划 + 贪心

### 1. 买卖股票的最佳时机（LeetCode 121 · Easy）

#### 题目

给定一个数组 prices，它的第 i 个元素表示一支股票第 i 天的价格。你只能选择某一天买入，并选择在未来的某一个不同的日子卖出，返回你能获取的最大利润。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2483/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/394460/)
- 题目详解：[[121-买卖股票的最佳时机|打开完整题解]]

#### 解题思路

**思路讲解：** 核心思想是在遍历过程中维护两个变量：
- `min_price`：遍历到当前位置时的最低价格（历史最低价）
- `max_profit`：到当前位置时能获得的最大利润

每遍历一天，先用当天价格更新 `min_price`（保证买入价最低），再计算"如果今天卖出"的利润 `price - min_price`，用它更新 `max_profit`。这就是贪心思想的体现——在每一天都做局部最优决策（找历史最低买入价），最终得到全局最优（最大利润）。

**时间复杂度：** O(n) | **空间复杂度：** O(1)

#### 易错点
- **数组长度为 1**：只能买入无法卖出，利润为 0，代码应能正确处理
- **价格一直下跌**：不交易利润为 0，不要返回负数
- **先买后卖顺序**：不能先卖后买（不能做空），利润 = 后面价格 - 前面价格必须非负才能交易
- **初始值设置**：`min_price` 初始化为 `INT_MAX` 而非 `prices[0]`，这样第一个元素就能正确更新
- **DP 写法中 dp1 的更新**：只能用 `-price` 而非 `dp1`（因为只能买一次），如果允许多次买卖则用 `dp0 - price`

#### YXC 最终代码
```cpp
class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int res = 0;
        for (int i = 0, minp = INT_MAX; i < prices.size(); i ++ ) {  // 初始化为最大可能值
            res = max(res, prices[i] - minp);
            minp = min(minp, prices[i]);
        }
        return res;
    }
};
```


### 2. 跳跃游戏（LeetCode 55 · Medium）

#### 题目

给你一个非负整数数组，你最初位于数组的第一个下标。判断你是否能够到达最后一个下标。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/jump-game/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2400/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/362214/)
- 题目详解：[[55-跳跃游戏|打开完整题解]]

#### 解题思路

**思路讲解：** 遍历数组的每个位置，用一个变量 `max_reach` 记录当前能到达的最远位置。对于每个位置 `i`：
1. 如果 `i > max_reach`，说明当前位置已经超出最远可达范围，返回 `false`
2. 否则，用 `i + nums[i]` 更新 `max_reach`（取较大值）
3. 如果 `max_reach >= n-1`，说明最远已覆盖终点，返回 `true`

为什么贪心是对的？因为如果能到位置 `i`，则 `i` 之前的所有位置都能到，所以维护最远距离这个"局部最优"等价于"全局最优"。

**时间复杂度：** O(n) | **空间复杂度：** O(1)

#### 易错点
- **数组长度为 1**：起点就是终点，直接返回 `true`。贪心写法需要确保在 `n=1` 时不会在循环中提前返回 `false`
- **`nums[i] = 0` 的陷阱**：位置 i 能否被安全跳过取决于它是否在 `max_reach` 范围内。如果 0 出现在中间并且 `max_reach` 能覆盖，依然可以到达终点
- **更新 `max_reach` 的顺序**：必须先检查 `i > max_reach`，再更新 `max_reach`。如果先更新再检查，会错误地将不可达的位置标记为可达
- **反向遍历时 `last` 的初始值**：应设为 `n - 1`，而不是 `n`
- **不要忽略大数溢出**：`i + nums[i]` 可能超过 `n-1`，这在 C++ 中没问题，但在某些语言中需要注意

#### YXC 最终代码
```cpp
class Solution {
public:
    bool canJump(vector<int>& nums) {
        for (int i = 0, j = 0; i < nums.size(); i ++ ) {
            if (j < i) return false;
            j = max(j, i + nums[i]);
        }
        return true;
    }
};
```


### 3. 跳跃游戏 II（LeetCode 45 · Medium）

#### 题目

给你一个非负整数数组，你最初位于数组的第一个位置。使用最少的跳跃次数到达数组的最后一个位置。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/jump-game-ii/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2382/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/356247/)
- 题目详解：[[45-跳跃游戏II|打开完整题解]]

#### 解题思路

**思路讲解：** 定义 `f[i]` 为到达位置 i 的最小跳跃次数。用 `j` 指针维护当前能跳到 i 的最左起点。由于 `nums[j] + j < i` 时 j 无法跳到 i，需要向右移动 j 直到找到第一个能跳到 i 的位置。由于 j 单调递增，整体时间复杂度 O(n)。

**核心推理：**
- 维护指针 `j` 表示当前能覆盖到 i 的最左起跳点。
- 如果 `j + nums[j] < i`，说明从 j 起跳无法到达 i，j 向右移动。
- 到达 i 的最小跳跃次数 = `f[j] + 1`（从 j 起跳，多跳一步到 i）。
- j 的单调性保证了每个位置只被遍历一次。

**时间复杂度：** O(n) | **空间复杂度：** O(n)

#### 易错点
- **数组长度为 1**：循环 `for (int i = 1; i < n; i ++ )` 不会执行，`f[n-1] = f[0] = 0`，直接返回 0。
- **j 的单调性：** j 只增不减，因为后面位置的起跳起点一定不会比前面位置的起跳起点更靠左。
- **`j + nums[j] < i` 的判断：** 如果这个条件成立，说明 j 无法跳到 i，需要继续向右寻找新起点。题目保证可达，所以最终一定能找到。
- **DP 数组的含义：** `f[i]` 是到达 i 的最小跳跃次数，而不是从 i 出发能跳到的最远位置。
- **与贪心法的区别：** 贪心（BFS 层序遍历）空间 O(1)，但 DP 思路更直观，且同样 O(n) 时间。

#### YXC 最终代码
```cpp
class Solution {
public:
    int jump(vector<int>& nums) {
        int n = nums.size();
        vector<int> f(n);

        for (int i = 1, j = 0; i < n; i ++ ) {
            while (j + nums[j] < i) j ++ ;
            f[i] = f[j] + 1;
        }

        return f[n - 1];
    }
};
```


### 4. 划分字母区间（LeetCode 763 · Medium）

#### 题目

给你一个字符串 s，要把这个字符串划分为尽可能多的片段，同一字母最多出现在一个片段中。返回一个表示每个字符串片段的长度的列表。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/partition-labels/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/3673/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/1039493/)
- 题目详解：[[763-划分字母区间|打开完整题解]]

#### 解题思路

**思路讲解：** 分两步走：

**第一步（预处理）：** 遍历一次字符串，用哈希表（或长度为 26 的数组）记录每个字符最后出现的下标。

**第二步（贪心切割）：** 再次遍历字符串，维护：
- `start`：当前片段的起始位置
- `end`：当前片段的右边界（动态扩展）
- 每遇到一个字符 `c`，就将 `end` 更新为 `max(end, last[c])`
- 当 `i == end` 时，说明当前片段结束，记录长度 `end - start + 1`，然后 `start = i + 1` 开始下一个片段

**为什么贪心是对的？** 每个字符的"最后出现位置"是不可妥协的硬约束，在满足约束的前提下，尽早切分（`i == end` 时立即切）能得到最多片段，局部最优（尽早切）就是全局最优（片段最多）。

**时间复杂度：** O(n)（两次遍历） | **空间复杂度：** O(26) = O(1)

#### 易错点
- **更新 `end` 时用 `last[c]` 而非 `i`**：`last[c]` 是字符 c 的最后出现位置，不能写成 `end = max(end, i)`
- **切分时机**：必须在 `i == end` 时切分。如果提前切分，同一个字母可能出现在多个片段中；如果延后切分，片段数会减少
- **`start` 的更新**：切分后 `start = i + 1`，注意不是 `start = end + 1`（虽然此时 `i == end`，但语义上应该是下一个位置）
- **`s` 长度可能为 1**：这时应该返回 `[1]`，代码应能正确处理
- **所有字符都相同的情况**：如 `"aaaa"`，整个字符串只有一个片段 `[4]`
- **不区分大小写**：题目字符串仅包含小写字母，无需考虑大小写

#### YXC 最终代码
```cpp
class Solution {
public:
    vector<int> partitionLabels(string S) {
        unordered_map<int, int> last;                            // 哈希表，O(1)查找
        for (int i = 0; i < S.size(); i ++ ) last[S[i]] = i;
        vector<int> res;
        int start = 0, end = 0;
        for (int i = 0; i < S.size(); i ++ ) {
            end = max(end, last[S[i]]);
            if (i == end) {
                res.push_back(end - start + 1);                  // 记录结果
                start = end = i + 1;
            }
        }
        return res;
    }
};
```


### 5. 爬楼梯（LeetCode 70 · Easy）

#### 题目

假设你正在爬楼梯。需要 n 阶你才能到达楼顶。每次你可以爬 1 或 2 个台阶。有多少种不同的方法可以爬到楼顶？

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/climbing-stairs/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2415/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/363638/)
- 题目详解：[[70-爬楼梯|打开完整题解]]

#### 解题思路

**核心洞察**：爬到第 i 阶的最后一步有两种可能——从第 i-1 阶走 1 步，或者从第 i-2 阶走 2 步。因此 `dp[i] = dp[i-1] + dp[i-2]`。

**DP 五步法：**
1. **dp 定义**：`dp[i]` 表示爬到第 i 阶的方法数
2. **递推公式**：`dp[i] = dp[i-1] + dp[i-2]`
3. **初始化**：`dp[1] = 1`（1 步到第 1 阶），`dp[2] = 2`（1+1 或 2）
4. **遍历顺序**：从 i=3 到 n，正序
5. **举例验证**：n=4 → dp[1]=1, dp[2]=2, dp[3]=3, dp[4]=5 ✓

#### 易错点
- **n 的范围**：题目 n 从 1 开始，要处理 n=1 直接返回 1，不要访问 dp[2] 导致越界。
- **初始化值**：`dp[0]` 在数学上有定义（dp[0]=1 表示空楼梯），但实际遍历中从 i=3 开始更直观。
- **结果溢出**：虽然 n<=45 不会溢出，但大数场景需注意类型。

#### YXC 最终代码
```cpp
class Solution {
public:
    int climbStairs(int n) {
        int a = 1, b = 1;
        while ( -- n) {
            int c = a + b;
            a = b, b = c;
        }
        return b;
    }
};
```


### 6. 杨辉三角（LeetCode 118 · Easy）

#### 题目

给定一个非负整数 numRows，生成杨辉三角的前 numRows 行。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/pascals-triangle/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2480/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/390367/)
- 题目详解：[[118-杨辉三角|打开完整题解]]

#### 解题思路

**核心洞察**：每行第一个和最后一个为 1，中间元素 `row[j] = prev_row[j-1] + prev_row[j]`。利用上一行的结果构建当前行，天然满足 DP 的状态依赖关系。

**DP 五步法：**
1. **dp 定义**：无显式 dp 表，每行的 list 即为当前状态
2. **初始化**：每行为 `[1] * (i+1)`
3. **递推**：`row[j] = res[i-1][j-1] + res[i-1][j]`（j 从 1 到 i-1）
4. **遍历顺序**：从第 0 行到第 numRows-1 行
5. **举例验证**：numRows=5 → 见示例

#### 易错点
- **行索引偏移**：第 i 行有 i+1 个元素（i 从 0 开始），循环时要小心 range 的范围。
- **边界处理**：`range(1, i)` 在 i=0 或 i=1 时自动为空，不会进入内部循环。
- **中间元素计算**：依赖 `res[i-1]` 必须在之前已构建好，顺序不可颠倒。

#### YXC 最终代码
```cpp
class Solution {
public:
    vector<vector<int>> generate(int n) {
        vector<vector<int>> f;
        for (int i = 0; i < n; i ++ ) {                          // 遍历
            vector<int> line(i + 1);
            line[0] = line[i] = 1;
            for (int j = 1; j < i; j ++ )
                line[j] = f[i - 1][j - 1] + f[i - 1][j];
            f.push_back(line);
        }
        return f;
    }
};
```


### 7. 打家劫舍（LeetCode 198 · Medium）

#### 题目

你是一个专业的小偷，计划偷窃沿街的房屋。如果两间相邻的房屋在同一晚上被小偷闯入，系统会自动报警。给定一个数组，计算不触动警报装置的情况下，一夜之内能够偷窃到的最高金额。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/house-robber/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2566/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/421971/)
- 题目详解：[[198-打家劫舍|打开完整题解]]

#### 解题思路

**核心洞察**：对于第 i 间房，如果偷，则 i-1 不能偷，总金额 = `dp[i-2] + nums[i-1]`；如果不偷，总金额 = `dp[i-1]`。两者取大。

**DP 五步法：**
1. **dp 定义**：`dp[i]` 表示前 i 间房屋（即 nums[0..i-1]）能偷到的最高金额
2. **递推公式**：`dp[i] = max(dp[i-1], dp[i-2] + nums[i-1])`
3. **初始化**：`dp[0] = 0`（没有房子），`dp[1] = nums[0]`（只有一间房）
4. **遍历顺序**：从 i=2 到 n，正序
5. **举例验证**：nums=[2,7,9,3,1] → dp[1]=2, dp[2]=max(2,7)=7, dp[3]=max(7,2+9=11)=11, dp[4]=max(11,7+3=10)=11, dp[5]=max(11,11+1=12)=12 ✓

#### 易错点
- **空数组处理**：题目提示长度 >= 1，但防御性编程应处理空数组。
- **初始化值**：`dp[0]` 是 0（没有房子），`dp[1]` 是 nums[0]，不是 0。
- **仅有一间房**：直接返回 nums[0]，不能走递推（dp[2] 越界）。
- **递推公式混淆**：不要写成 `dp[i] = max(dp[i-1], dp[i-2] + nums[i])`，注意 nums 索引偏移。

#### YXC 最终代码
```cpp
class Solution {
public:
    int rob(vector<int>& nums) {
        int n = nums.size();
        vector<int> f(n + 1), g(n + 1);
        for (int i = 1; i <= n; i ++ ) {
            f[i] = g[i - 1] + nums[i - 1];
            g[i] = max(f[i - 1], g[i - 1]);
        }
        return max(f[n], g[n]);
    }
};
```


### 8. 完全平方数（LeetCode 279 · Medium）

#### 题目

给你一个整数 n，返回和为 n 的完全平方数的最少数量。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/perfect-squares/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2647/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/451625/)
- 题目详解：[[279-完全平方数|打开完整题解]]

#### 解题思路

**核心洞察**：利用拉格朗日四平方和定理——每个正整数都可以表示为至多 4 个完全平方数的和。且有以下性质：
1. 如果 n 本身是完全平方数，答案为 1。
2. 如果 n 可以表示为 `a² + b²`（即 n - a² 是完全平方数），答案为 2。
3. 如果 n 满足 `n = 4^k × (8m + 7)`，答案为 4（勒让德三平方定理的推论）。
4. 其余情况，答案为 3。

**算法流程：**
1. 先检查 n 是否为完全平方数 → 是则返回 1。
2. 枚举 a 从 1 到 sqrt(n)，检查 n - a² 是否为完全平方数 → 是则返回 2。
3. 利用 `n = 4^k × (8m + 7)` 判断 → 是则返回 4。
4. 否则返回 3。

**复杂度：** 时间 O(√n)，空间 O(1)

#### 易错点
- **完全平方数检查：** `r = sqrt(x)` 后用 `r * r == x` 判断，注意浮点数精度问题（C++ 的 sqrt 对 int 范围内的数精度足够）。
- **枚举 a 的范围：** `a <= n / a` 等价于 `a * a <= n`，用除法可以避免溢出。
- **`n = 4^k × (8m + 7)` 的判断：** 先不断除以 4 直到不能被 4 整除，再检查 `n % 8 == 7`。
- **DP 解法的替代：** 如果面试官要求 DP 解法，可以用完全背包，但本题的四平方和定理是数学最优解，时间和空间都更优。

#### YXC 最终代码
```cpp
class Solution {
public:
    bool check(int x) {
        int r = sqrt(x);
        return r * r == x;
    }

    int numSquares(int n) {
        if (check(n)) return 1;

        for (int a = 1; a <= n / a; a ++ )
            if (check(n - a * a))
                return 2;

        while (n % 4 == 0) n /= 4;
        if (n % 8 != 7) return 3;
        return 4;
    }
};
```


### 9. 零钱兑换（LeetCode 322 · Medium）

#### 题目

给你一个整数数组 coins 表示不同面额的硬币，以及一个整数 amount 表示总金额。计算并返回可以凑成总金额所需的最少的硬币个数。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/coin-change/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2713/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/477128/)
- 题目详解：[[322-零钱兑换|打开完整题解]]

#### 解题思路

**核心洞察**：对于每个金额 j，如果选择面额 coin 的硬币，则问题变为凑 j-coin 的最少硬币数 + 1。在所有 coin 中取最小值。

**DP 五步法：**
1. **dp 定义**：`dp[j]` 表示凑成金额 j 所需的最少硬币数
2. **递推公式**：`dp[j] = min(dp[j], dp[j - coin] + 1)` for coin in coins
3. **初始化**：`dp[0] = 0`，`dp[1..amount] = amount + 1`（一个不可能的大数）
4. **遍历顺序**：先遍历硬币（物品），再正序遍历金额（背包容量）——完全背包标准顺序
5. **举例验证**：coins=[1,2,5], amount=11 → dp[0]=0, dp[1]=1, dp[2]=1, ..., dp[5]=1, dp[10]=2, dp[11]=min(dp[10]+1, dp[9]+1, dp[6]+1)=3 ✓

#### 易错点
- **返回 -1 的判断**：用 `amount + 1` 作为不可能达到的初值，最后检查 `dp[amount]` 是否仍为初值。
- **amount = 0**：直接返回 0，因为 dp[0] 已初始化为 0。
- **硬币面额大小**：coins[i] 可能大于 amount，遍历背包时 `range(coin, amount+1)` 自动跳过。
- **完全背包 vs 0-1 背包**：一维完全背包正序遍历，0-1 背包倒序遍历。顺序反了会导致结果错误。

#### YXC 最终代码
```cpp
class Solution {
public:
    int coinChange(vector<int>& coins, int m) {
        vector<int> f(m + 1, 1e8);
        f[0] = 0;
        for (auto v: coins)
            for (int j = v; j <= m; j ++ )
                f[j] = min(f[j], f[j - v] + 1);
        if (f[m] == 1e8) return -1;
        return f[m];
    }
};
```


### 10. 单词拆分（LeetCode 139 · Medium）

#### 题目

给你一个字符串 s 和一个字符串列表 wordDict 作为字典。请你判断是否可以利用字典中出现的单词拼接出 s。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/word-break/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2509/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/400818/)
- 题目详解：[[139-单词拆分|打开完整题解]]

#### 解题思路

**核心洞察**：定义 `dp[i]` 表示 s 的前 i 个字符（s[0:i]）能否被拆分。对于每个位置 i，检查是否存在一个切割点 j < i，使得 s[0:j] 可拆分且 s[j:i] 在字典中。这相当于完全背包的"组合"问题——物品能否按顺序拼成目标。

**DP 五步法：**
1. **dp 定义**：`dp[i]` 表示 s 的前 i 个字符是否能被拆分成字典中的单词
2. **递推公式**：`dp[i] = any(dp[j] and s[j:i] in word_set for j in range(i))`
3. **初始化**：`dp[0] = true`（空字符串视为可拆分）
4. **遍历顺序**：从 i=1 到 len(s)，内层遍历 j < i
5. **举例验证**：s="leetcode", wordDict=["leet","code"] → dp[0]=T, dp[4]=T（"leet"）, dp[8]=dp[4] and "code" in unordered_map = T ✓

#### 易错点
- **dp 索引偏移**：`dp[i]` 对应 s[0:i]（前 i 个字符，不包含 s[i]），所以 `dp[n]` 是最终答案。
- **skipping break**：找到解后及时 `break` 内层循环，避免多余计算。
- **子串截取性能**：`s[j:i]` 是 O(k) 操作。字典用 set 保证 O(1) 查找。如果 n 很大可考虑用 Trie 树优化。
- **字典去重**：unordered_map 中可能有重复单词，用 set 去重可以优化，但不是必须。

#### YXC 最终代码
```cpp
class Solution {
public:
    bool wordBreak(string s, vector<string>& wordDict) {
        typedef unsigned long long ULL;
        const int P = 131;
        unordered_set<ULL> hash;                                 // 哈希集合，去重+O(1)查找
        for (auto& word: wordDict) {
            ULL h = 0;
            for (auto c: word) h = h * P + c;
            hash.insert(h);
        }

        int n = s.size();
        vector<bool> f(n + 1);
        f[0] = true;
        s = ' ' + s;
        for (int i = 0; i < n; i ++ )                            // 遍历
            if (f[i]) {
                ULL h = 0;
                for (int j = i + 1; j <= n; j ++ ) {
                    h = h * P + s[j];
                    if (hash.count(h)) f[j] = true;              // 查找是否在哈希表中
                }
            }

        return f[n];
    }
};
```




## Day 13：多维 DP

### 1. 最长递增子序列（LeetCode 300 · Medium）

#### 题目

给你一个整数数组 nums，找到其中最长严格递增子序列的长度。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/longest-increasing-subsequence/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2672/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/456581/)
- 题目详解：[[300-最长递增子序列|打开完整题解]]

#### 解题思路

**核心洞察**：定义 `dp[i]` 为以 nums[i] **结尾**的最长递增子序列长度。对于每个 i，遍历它前面的所有 j，如果 nums[j] < nums[i]，就可以在 dp[j] 的基础上接上 nums[i]。

**DP 五步法：**
1. **dp 定义**：`dp[i]` 表示以 nums[i] 结尾的 LIS 长度
2. **递推公式**：`dp[i] = max(dp[i], dp[j] + 1)` for j < i if nums[j] < nums[i]
3. **初始化**：所有 `dp[i] = 1`（至少包含自身）
4. **遍历顺序**：从左到右，内层 j 从 0 到 i-1
5. **举例验证**：nums=[10,9,2,5,3,7,101,18] → dp[0]=1, dp[1]=1, dp[2]=1, dp[3]=max(1,1+1)=2, dp[4]=max(1,1+1)=2, dp[5]=max(1,2+1,2+1)=3, dp[6]=4, dp[7]=4 ✓

#### 易错点
- **dp[i] 定义**：是以 nums[i] **结尾**，不是"前 i 个"！所以最后返回 `max(dp)` 不是 `dp[-1]`。
- **初始化**：所有 dp[i] 至少是 1，不要初始化为 0。
- **严格递增**：条件是 `<` 不是 `<=`。
- **二分查找用 lower_bound_left**：需要严格递增时用 lower_bound_left；如果允许相等（非严格），用 lower_bound_right。
- **tails 数组的含义**：tails 不是 LIS 本身，只是存储最小末尾值的辅助数组。

#### YXC 最终代码
```cpp
class Solution {
public:
    int lengthOfLIS(vector<int>& nums) {
        int n = nums.size();
        vector<int> q;
        for (auto x: nums) {
            if (q.empty() || x > q.back()) q.push_back(x);       // 入队
            else {
                if (x <= q[0]) q[0] = x;
                else {
                    int l = 0, r = q.size() - 1;
                    while (l < r) {
                        int mid = l + r + 1 >> 1;
                        if (q[mid] < x) l = mid;
                        else r = mid - 1;
                    }
                    q[r + 1] = x;
                }
            }
        }
        return q.size();
    }
};
```


### 2. 乘积最大子数组（LeetCode 152 · Medium）

#### 题目

给你一个整数数组 nums，请你找出数组中乘积最大的非空连续子数组，并返回该子数组所对应的乘积。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/maximum-product-subarray/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2533/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/411014/)
- 题目详解：[[152-乘积最大子数组|打开完整题解]]

#### 解题思路

**核心洞察**：由于负数的存在，当前最大乘积可能来自之前的最大正数乘正数，也可能来自之前的最小负数乘负数。因此同时维护当前最大 `max_prod` 和当前最小 `min_prod`。

**DP 五步法：**
1. **dp 定义**：`max_prod[i]` 表示以 i 结尾的子数组最大乘积，`min_prod[i]` 表示最小乘积
2. **递推公式**：
   - `max_prod[i] = max(nums[i], max_prod[i-1] * nums[i], min_prod[i-1] * nums[i])`
   - `min_prod[i] = min(nums[i], max_prod[i-1] * nums[i], min_prod[i-1] * nums[i])`
3. **初始化**：`max_prod[0] = min_prod[0] = nums[0]`
4. **遍历顺序**：从左到右
5. **举例验证**：nums=[2,3,-2,4] → i=0: max=2,min=2,res=2; i=1: max=6,min=3,res=6; i=2: max=max(-2,6*(-2),3*(-2))=-2, min=-12, res=6; i=3: max=max(4,-2*4,-12*4)=4, min=-48, res=6 ✓

#### 易错点
- **负数处理**：遇到负数时，最大和最小要互换（因为负数使得大的变小、小的变大）。
- **乘以 0**：遇到 0 时，乘积变为 0，后续需要重新累积。前缀积解法中要重置为 1。
- **单元素数组**：初始值设为 `nums[0]`，遍历从 index=1 开始。
- **结果溢出不考虑**：题目保证结果在 32 位整型范围内。

#### YXC 最终代码
```cpp
class Solution {
public:
    int maxProduct(vector<int>& nums) {
        int res = nums[0];
        int f = nums[0], g = nums[0];
        for (int i = 1; i < nums.size(); i ++ ) {
            int a = nums[i], fa = f * a, ga = g * a;
            f = max(a, max(fa, ga));
            g = min(a, min(fa, ga));
            res = max(res, f);
        }
        return res;
    }
};
```


### 3. 分割等和子集（LeetCode 416 · Medium）

#### 题目

给你一个只包含正整数的非空数组 nums，请你判断是否可以将这个数组分割成两个子集，使得两个子集的元素和相等。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/partition-equal-subset-sum/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2813/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/531708/)
- 题目详解：[[416-分割等和子集|打开完整题解]]

#### 解题思路

**核心洞察**：这是一个经典的 0-1 背包问题——从数组中选若干个数，每个数选或不选，使其和等于 target（总和的一半）。`dp[j]` 表示是否存在和为 j 的子集。

**DP 五步法：**
1. **dp 定义**：`dp[j]` 表示是否存在和为 j 的子集（布尔值）
2. **递推公式**：`dp[j] = dp[j] or dp[j - num]`（当前元素选或不选）
3. **初始化**：`dp[0] = true`（空集和为 0）
4. **遍历顺序**：先元素（物品），再倒序遍历 target（保证每个元素只用一次）
5. **举例验证**：nums=[1,5,11,5], target=11 → dp[0]=T; num=1: dp[1]=T; num=5: dp[5]=T, dp[6]=T; num=11: dp[11]=T ✓

#### 易错点
- **总和奇偶判断**：必须先用 `sum % 2` 判断，奇数和无法平分。
- **0-1 背包倒序遍历**：这是最关键的区别！正序遍历会错误地变成"完全背包"（同一元素多次使用）。
- **target 可能比最大元素小**：如果最大元素 > target，可以直接返回 false。
- **dp[0] = true**：空子集的和总是 0，这是递推的基础。

#### YXC 最终代码
```cpp
class Solution {
public:
    bool canPartition(vector<int>& nums) {
        int n = nums.size(), m = 0;
        for (auto x: nums) m += x;
        if (m % 2) return false;
        m /= 2;
        vector<int> f(m + 1);
        f[0] = 1;
        for (auto x: nums)
            for (int j = m; j >= x; j -- )
                f[j] |= f[j - x];
        return f[m];
    }
};
```


### 4. 最长有效括号（LeetCode 32 · Hard）

#### 题目

给你一个只包含 '(' 和 ')' 的字符串，找出最长有效（格式正确且连续）括号子串的长度。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/longest-valid-parentheses/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2369/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/355012/)
- 题目详解：[[32-最长有效括号|打开完整题解]]

#### 解题思路

**核心洞察**：`dp[i]` 表示以 s[i] 结尾的最长有效括号长度。只有 s[i] = `)` 才可能非零。分两种情况：
1. `s[i-1] = '('`：配对，`dp[i] = dp[i-2] + 2`
2. `s[i-1] = ')'`：检查是否形如 `(...(XXX))`，需要找到与 s[i] 配对的位置

**DP 五步法：**
1. **dp 定义**：`dp[i]` 表示以 s[i] 结尾的最长有效括号子串长度
2. **递推公式**：
   - s[i] = '(' → `dp[i] = 0`
   - s[i] = ')' 且 s[i-1] = '(' → `dp[i] = dp[i-2] + 2`
   - s[i] = ')' 且 s[i-1] = ')' → 找到配对位置 j = i - dp[i-1] - 1，若 s[j] = '(' → `dp[i] = dp[i-1] + 2 + dp[j-1]`
3. **初始化**：全 0
4. **遍历顺序**：从左到右，从 i=1 开始
5. **举例验证**：s=")()())" → dp[0]=0, dp[1]=0, dp[2]=2, dp[3]=0, dp[4]=2+2=4, dp[5]=0, max=4 ✓

#### 易错点
- **dp 仅对 `)` 有意义**：以 `(` 结尾的子串不可能是有效括号，dp 值为 0。
- **情况 2 的配对位置计算**：`j = i - dp[i-1] - 1` 是核心难点，画图辅助理解。
- **拼接之前有效长度**：最后要加 `dp[j-1]`，因为 `XXX(...(XXX))` 前面可能还有有效括号。
- **双向扫描**：如果只用单向扫描，`((())` 这种情况会漏掉。
- **栈底初始为 -1**：这是技巧，保证第一个 `)` 也能正确计算长度。

#### YXC 最终代码
```cpp
class Solution {
public:
    int longestValidParentheses(string s) {
        stack<int> stk;

        int res = 0;
        for (int i = 0, start = -1; i < s.size(); i ++ ) {
            if (s[i] == '(') stk.push(i);                        // 入栈
            else {
                if (stk.size()) {
                    stk.pop();                                   // 出栈
                    if (stk.size()) {
                        res = max(res, i - stk.top());
                    } else {
                        res = max(res, i - start);
                    }
                } else {
                    start = i;
                }
            }
        }

        return res;
    }
};
```


### 5. 不同路径（LeetCode 62 · Medium）

#### 题目

一个机器人位于一个 m x n 网格的左上角。机器人每次只能向下或向右移动一步。机器人试图达到网格的右下角，问总共有多少条不同的路径？

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/unique-paths/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2407/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/363536/)
- 题目详解：[[62-不同路径|打开完整题解]]

#### 解题思路

**核心洞察**：到达 (i,j) 的路径数 = 到达 (i-1,j) 的路径数（从上面来）+ 到达 (i,j-1) 的路径数（从左边来）。第一行和第一列的所有格子都只有 1 条路径。

**DP 五步法：**
1. **dp 定义**：`dp[i][j]` 表示到达 (i,j) 的不同路径数
2. **递推公式**：`dp[i][j] = dp[i-1][j] + dp[i][j-1]`
3. **初始化**：第一行 `dp[0][j] = 1`，第一列 `dp[i][0] = 1`
4. **遍历顺序**：从左到右，从上到下（依赖上方和左方）
5. **举例验证**：m=3, n=3 → 第一行 [1,1,1], 第一列 [1,1,1]; dp[1][1]=1+1=2, dp[1][2]=1+2=3, dp[2][1]=1+2=3, dp[2][2]=3+3=6 ✓

#### 易错点
- **索引范围**：dp 数组是 m x n，但递推时从 i=1, j=1 开始，避免访问 `dp[-1]`。
- **初始化**：第一行 `dp[0][j]` 和第一列 `dp[i][0]` 都是 1（不是 0！），因为只有一条路径。
- **m, n 输入顺序**：m 是行数，n 是列数。创建数组时 `dp = [[1]*n for _ in range(m)]`。
- **组合数溢出**：C++ 的 math.comb 可以处理大数，但 C 语言等需注意溢出。

#### YXC 最终代码
```cpp
class Solution {
public:
    int uniquePaths(int m, int n) {
        vector<vector<int>> f(n, vector<int>(m));
        for (int i = 0; i < n; i ++ )                            // 遍历
            for (int j = 0; j < m; j ++ )
                if (!i && !j) f[i][j] = 1;
                else {
                    if (i) f[i][j] += f[i - 1][j];
                    if (j) f[i][j] += f[i][j - 1];
                }

        return f[n - 1][m - 1];
    }
};
```


### 6. 最小路径和（LeetCode 64 · Medium）

#### 题目

给定一个包含非负整数的 m x n 网格，请找出一条从左上角到右下角的路径，使得路径上的数字总和为最小。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/minimum-path-sum/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2409/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/363553/)
- 题目详解：[[64-最小路径和|打开完整题解]]

#### 解题思路

**核心洞察**：到达 (i,j) 的最小路径和 = grid[i][j] + min(从上方来的路径和, 从左方来的路径和)。第一行只能从左来，第一列只能从上来。

**DP 五步法：**
1. **dp 定义**：`dp[i][j]` 表示到达 (i,j) 的最小路径和
2. **递推公式**：`dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])`
3. **初始化**：`dp[0][0] = grid[0][0]`；第一行：`dp[0][j] = dp[0][j-1] + grid[0][j]`；第一列：`dp[i][0] = dp[i-1][0] + grid[i][0]`
4. **遍历顺序**：从左到右，从上到下
5. **举例验证**：grid=[[1,3,1],[1,5,1],[4,2,1]] → dp[0]=[1,4,5]; dp[1]=[2,7,6]; dp[2]=[6,8,7] ✓

#### 易错点
- **初始化顺序**：必须先初始化 dp[0][0] 和第一行、第一列，再递推中间部分。
- **原地修改副作用**：如果外部需要保留原 grid 数据，不要用原地修改。
- **一维 DP 的 dp[0] 处理**：每行开头 `dp[0] += grid[i][0]` 不能忘。
- **索引越界**：创建定长数组后，小心 m, n 为 1 的边界情况。

#### YXC 最终代码
```cpp
class Solution {
public:
    int minPathSum(vector<vector<int>>& grid) {
        int n = grid.size();
        if (!n) return 0;
        int m = grid[0].size();

        vector<vector<int>> f(n, vector<int>(m, INT_MAX));       // 初始化为最大可能值
        for (int i = 0; i < n; i ++ )                            // 遍历
            for (int j = 0; j < m; j ++ ) {
                if (!i && !j) f[i][j] = grid[i][j];
                else {
                    if (i) f[i][j] = min(f[i][j], f[i - 1][j] + grid[i][j]);
                    if (j) f[i][j] = min(f[i][j], f[i][j - 1] + grid[i][j]);
                }
            }

        return f[n - 1][m - 1];
    }
};
```


### 7. 最长回文子串（LeetCode 5 · Medium）

#### 题目

给你一个字符串 s，找到 s 中最长的回文子串。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/longest-palindromic-substring/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2330/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/339912/)
- 题目详解：[[5-最长回文子串|打开完整题解]]

#### 解题思路

**核心洞察**：回文串一定是对称的，所以每个字符（以及每两个相邻字符之间）都可以作为回文中心，向两边扩展直到不是回文。长度为 n 的字符串有 2n-1 个可能的中心。

#### 易错点
- **DP 遍历顺序**：必须从下往上（i 递减），因为 `dp[i][j]` 依赖 `dp[i+1][j-1]`。从下往上保证左下角先被计算。
- **中心扩展的数量**：n 个字符有 2n-1 个中心（n 个单字符中心 + n-1 个双字符中心）。
- **子串 vs 子序列**：本题是子串（连续），区分于回文子序列问题。
- **长度 1 的特殊情况**：任何单字符都是回文，直接返回 s 本身。

#### YXC 最终代码
```cpp
class Solution {
public:
    string longestPalindrome(string s) {
        string res;
        for (int i = 0; i < s.size(); i ++ ) {
            int l = i - 1, r = i + 1;
            while (l >= 0 && r < s.size() && s[l] == s[r]) l --, r ++ ;
            if (res.size() < r - l - 1) res = s.substr(l + 1, r - l - 1);

            l = i, r = i + 1;
            while (l >= 0 && r < s.size() && s[l] == s[r]) l --, r ++ ;
            if (res.size() < r - l - 1) res = s.substr(l + 1, r - l - 1);
        }

        return res;
    }
};
```


### 8. 最长公共子序列（LeetCode 1143 · Medium）

#### 题目

给定两个字符串 text1 和 text2，返回这两个字符串的最长公共子序列的长度。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/longest-common-subsequence/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/6966/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/3538890/)
- 题目详解：[[1143-最长公共子序列|打开完整题解]]

#### 解题思路

**核心洞察**：`dp[i][j]` 表示 text1 前 i 个字符和 text2 前 j 个字符的 LCS 长度。如果 `text1[i-1] == text2[j-1]`，这个字符计入 LCS；否则从两个字符串各退一个字符的状态中取较大值。

**DP 五步法：**
1. **dp 定义**：`dp[i][j]` 表示 text1[0:i] 和 text2[0:j] 的最长公共子序列长度
2. **递推公式**：
   - 字符相等：`dp[i][j] = dp[i-1][j-1] + 1`
   - 字符不等：`dp[i][j] = max(dp[i-1][j], dp[i][j-1])`
3. **初始化**：`dp[0][j] = 0`，`dp[i][0] = 0`
4. **遍历顺序**：从上到下、从左到右
5. **举例验证**：text1="abcde", text2="ace" 时，匹配 a、c、e，答案为 3。

**复杂度：** 时间 O(n × m)，空间 O(n × m)

#### 易错点
- **索引偏移**：`text1[i-1]` 对应 `dp[i]`（前 i 个字符）。字符串索引和 dp 索引差 1。
- **遍历顺序不可颠倒**：必须先处理 text1 再处理 text2（或反过来都可以，但要一致）。不能提前用 dp[i-1][j-1] 的末初始化值。
- **相等时取 dp[i-1][j-1] + 1**：不是 dp[i-1][j] 或 dp[i][j-1] + 1。只有左上角状态才是两个字符串都退一个字符的 LCS。
- **不等时 max 的两个方向**：max(dp[i-1][j], dp[i][j-1]) 分别对应"跳过 text1 的当前字符"和"跳过 text2 的当前字符"。

#### YXC 最终代码
```cpp
class Solution {
public:
    int longestCommonSubsequence(string a, string b) {
        int n = a.size(), m = b.size();
        vector<vector<int>> f(n + 1, vector<int>(m + 1));
        for (int i = 1; i <= n; i ++ )
            for (int j = 1; j <= m; j ++ ) {
                f[i][j] = max(f[i - 1][j], f[i][j - 1]);
                if (a[i - 1] == b[j - 1])
                    f[i][j] = max(f[i][j], f[i - 1][j - 1] + 1);
            }
        return f[n][m];
    }
};
```


### 9. 编辑距离（LeetCode 72 · Medium）

#### 题目

给你两个单词 word1 和 word2，请返回将 word1 转换成 word2 所使用的最少操作数。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/edit-distance/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2421/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/370323/)
- 题目详解：[[72-编辑距离|打开完整题解]]

#### 解题思路

**核心洞察**：`dp[i][j]` 表示 word1 前 i 个字符转换成 word2 前 j 个字符的最小编辑距离。对于每个子问题，我们有三种选择：
1. **删除** word1 的最后一个字符 → `dp[i-1][j] + 1`
2. **插入** word2 的最后一个字符到 word1 → `dp[i][j-1] + 1`
3. **替换** 或跳过（字符相等时不用替换）→ `dp[i-1][j-1] + (0 或 1)`

**DP 五步法：**
1. **dp 定义**：`dp[i][j]` 表示 word1[0:i] → word2[0:j] 的最小编辑距离
2. **递推公式**：
   - 字符相等：`dp[i][j] = dp[i-1][j-1]`
   - 字符不等：`dp[i][j] = min(删除, 插入, 替换) + 1`
     - 删除：`dp[i-1][j] + 1`
     - 插入：`dp[i][j-1] + 1`
     - 替换：`dp[i-1][j-1] + 1`
3. **初始化**：`dp[i][0] = i`（删除所有字符），`dp[0][j] = j`（插入所有字符）
4. **遍历顺序**：从上到下、从左到右
5. **举例验证**：word1="horse", word2="ros" 时，最少执行 3 次编辑。

**复杂度：** 时间 O(n × m)，空间 O(n × m)

#### 易错点
- **边界初始化**：`dp[i][0] = i` 和 `dp[0][j] = j` 必须正确设置。很多初学者忘记或赋值错误。
- **字符串索引偏移**：`word1[i-1]` 与 `word2[j-1]` 比较，不是 `word1[i]` 与 `word2[j]`。
- **三个操作的理解**：删除是对 word1 删除（等价于对 word2 插入），插入是对 word1 插入（等价于对 word2 删除）。理解清楚可以减少困惑。
- **空间优化时左上角的处理**：一维 DP 中需要用变量暂存 `dp[j]` 的旧值作为下一列的左上角。

#### YXC 最终代码
```cpp
class Solution {
public:
    int minDistance(string a, string b) {
        int n = a.size(), m = b.size();
        a = ' ' + a, b = ' ' + b;
        vector<vector<int>> f(n + 1, vector<int>(m + 1));

        for (int i = 0; i <= n; i ++ ) f[i][0] = i;
        for (int i = 1; i <= m; i ++ ) f[0][i] = i;

        for (int i = 1; i <= n; i ++ )
            for (int j = 1; j <= m; j ++ ) {
                f[i][j] = min(f[i - 1][j], f[i][j - 1]) + 1;
                int t = a[i] != b[j];
                f[i][j] = min(f[i][j], f[i - 1][j - 1] + t);
            }

        return f[n][m];
    }
};
```




## Day 14：技巧专题

### 1. 只出现一次的数字（LeetCode 136 · Easy）

#### 题目

给定一个非空整数数组，除了某个元素只出现一次以外，其余每个元素均出现两次。找出那个只出现了一次的元素。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/single-number/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2506/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/400753/)
- 题目详解：[[136-只出现一次的数字|打开完整题解]]

#### 解题思路

**思路讲解：** 利用异或运算的三个性质：
1. `a ^ a = 0` — 相同数字异或结果为 0（自反性）
2. `a ^ 0 = a` — 任何数与 0 异或等于自身
3. 异或满足交换律和结合律：`a ^ b ^ c = a ^ c ^ b`

因此，把所有数字异或起来：成对出现的数字异或结果为 0，0 再与单身的那个数字异或，结果就是它本身。

**时间复杂度：** O(n) | **空间复杂度：** O(1)

#### 易错点
- **只有一个元素**：如 `nums = [1]`，异或结果为 1，代码应正确处理
- **负数的情况**：异或运算在 C++ 中对负数也能正常工作，无需特殊处理
- **不要忘记初始化 `ans = 0`**：如果初始化为其他值，结果会出错
- **异或运算在 C++ 中优先级低于比较运算符**：如果混合使用需要加括号，但本题中只需连续异或，无需担心
- **`sum(unordered_set(nums.begin(), nums.end()))` 可能溢出**：虽然 C++ 整数无上限，但其他语言需要注意
- **题目保证只有 1 个单身数**：如果有多个或没有，异或法就不适用了

#### YXC 最终代码
```cpp
class Solution {
public:
    int singleNumber(vector<int>& nums) {
        int res = 0;
        for (auto x: nums) res ^= x;
        return res;
    }
};
```


### 2. 多数元素（LeetCode 169 · Easy）

#### 题目

给定一个大小为 n 的数组，找到其中的多数元素。多数元素是指在数组中出现次数大于 ⌊n/2⌋ 的元素。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/majority-element/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2544/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/417114/)
- 题目详解：[[169-多数元素|打开完整题解]]

#### 解题思路

**思路讲解：** 核心思想是"正负抵消"。维护两个变量：
- `candidate`：当前候选的多数元素
- `count`：候选元素的"净胜票数"

遍历数组：
1. 如果 `count == 0`，将当前元素设为新的候选人
2. 如果当前元素 == `candidate`，则 `count += 1`
3. 否则 `count -= 1`

**为什么正确？** 多数元素出现次数超过一半，所以它的净胜票数一定为正。无论其他元素如何"围攻"，多数元素最终一定能保持为正。

**时间复杂度：** O(n) | **空间复杂度：** O(1)

#### 易错点
- **题目保证存在多数元素**：如果不保证，Boyer-Moore 算法得到的 `candidate` 需要再遍历一次验证是否真的 > `⌊n/2⌋`
- **`count` 归零时的处理**：`if count == 0: candidate = num`，然后下一句应该是 `count += 1`（因为当前票投给了新候选人）。在实现中需要注意不要写反顺序
- **`⌊n/2⌋` 的理解**：长度为 7 的数组，`⌊7/2⌋ = 3`，多数元素出现次数至少为 4；长度为 8，`⌊8/2⌋ = 4`，出现次数至少为 5
- **只有一个元素的情况**：直接返回该元素
- **排序法的陷阱**：排序后取 `nums[n // 2]` 成立的前提是多数元素存在，否则不成立

#### YXC 最终代码
```cpp
class Solution {
public:
    int majorityElement(vector<int>& nums) {
        int r, c = 0;
        for (auto x: nums)
            if (!c) r = x, c = 1;
            else if (r == x) c ++ ;
            else c -- ;
        return r;
    }
};
```


### 3. 颜色分类（LeetCode 75 · Medium）

#### 题目

给定一个包含红色、白色和蓝色、共 n 个元素的数组，原地对它们进行排序，使得相同颜色的元素相邻。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/sort-colors/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2424/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/370383/)
- 题目详解：[[75-颜色分类|打开完整题解]]

#### 解题思路

**思路讲解：** 设置三个指针：
- `zero`：指向 0 区域的右边界（初始为 0）
- `two`：指向 2 区域的左边界（初始为 `n-1`）
- `i`：当前遍历指针

遍历规则：
- `nums[i] == 0`：与 `nums[zero]` 交换，`zero++`，`i++`（因为换回来的一定是 1，可以前进）
- `nums[i] == 2`：与 `nums[two]` 交换，`two--`（**`i` 不动**，因为换回来的可能是 0 或 1，需要重新检查）
- `nums[i] == 1`：`i++`（白色的留在中间，直接跳过）

**时间复杂度：** O(n) | **空间复杂度：** O(1) | **遍历次数：** 1 次

#### 易错点
- **交换 2 时 `i` 不能前进**：这是最常见的 bug。当 `nums[i] == 2` 并与 `nums[two]` 交换后，从右边换回来的元素可能是 0 也可能是 1，必须重新判断，所以 `i` 不能自增
- **交换 0 时 `i` 可以前进**：因为 `nums[zero]` 是 0 区域的右边界，`nums[zero]` 的位置一定是 0 或 1（不会是 2，因为 2 已经被交换到右边了），所以交换后 `nums[i]` 是 0 或 1，如果是 1 就跳过，如果是 0 会在下一次循环被处理——等一下，实际上当 `nums[i]==0` 时交换后 `nums[zero]` 一定是1（因为 `zero` <= `i`，且所有 2 已经被交换到 `two` 之后），所以 `i` 可以安全地前进
- **循环条件 `while i <= two`**：当 `i > two` 时，说明所有位置都已处理好，循环结束。注意是 `<=` 不是 `<`
- **数组长度为 1**：三指针法能正确处理，不会进入交换逻辑
- **`nums = [2, 0, 1]` 测试**：这是个好的边界测试用例，可以验证交换逻辑

#### YXC 最终代码
```cpp
class Solution {
public:
    void sortColors(vector<int>& nums) {
        for (int i = 0, j = 0, k = nums.size() - 1; i <= k;) {
            if (nums[i] == 0) swap(nums[i ++ ], nums[j ++ ]);
            else if (nums[i] == 2) swap(nums[i], nums[k -- ]);
            else i ++ ;  // 当前值太小，排除当前行
        }
    }
};
```


### 4. 下一个排列（LeetCode 31 · Medium）

#### 题目

整数数组的一个排列就是将其所有成员以序列或线性顺序排列。实现获取下一个排列的函数。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/next-permutation/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2368/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/349093/)
- 题目详解：[[31-下一个排列|打开完整题解]]

#### 解题思路

**思路讲解：** 算法分为三步：

**第一步：找转折点。** 从右向左遍历，找到第一个 `nums[i] < nums[i+1]` 的位置 `i`。这个位置就是要调整的地方——在此处，升序被打破，说明我们可以通过改变这里的数字得到更大的排列。如果找不到这样的 `i`，说明整个数组是降序的，已经是最大排列，直接反转整个数组。

**第二步：找交换目标。** 从右向左找到第一个 `nums[j] > nums[i]` 的位置 `j`。这个 `nums[j]` 是右边比 `nums[i]` 大的数中最小的那个（因为从右向左第一个大于的就是最小的）。

**第三步：交换并反转。** 交换 `nums[i]` 和 `nums[j]`，然后将 `i+1` 到末尾的部分反转（因为此时这部分是降序的，反转后变成升序，即为最小的排列）。

**时间复杂度：** O(n) | **空间复杂度：** O(1)

#### 易错点
- **比较符号的细节**：找 `i` 时用 `nums[i] >= nums[i+1]`（包含等号），找 `j` 时用 `nums[j] <= nums[i]`（包含等号）。包含等号才能正确处理重复元素
- **`i` 可能为 -1**：如果整个数组是降序，`i` 保持为 -1，此时跳过交换步骤，直接反转整个数组
- **必须在原地修改 `nums`**：不能 `return` 新数组，必须直接修改 `nums` 的内容
- **反转的范围**：反转的是 `i+1` 到末尾，不是 0 到末尾。仅当 `i == -1` 时才反转整个数组
- **重复元素处理**：`[1,1,5]` 的下一个排列是 `[1,5,1]`，不是 `[1,1,5]`，算法中的 `>=` 和 `<=` 保证了这一点
- **数组长度为 1**：`n-2` 为 -1，`while` 循环不执行，`i` 为 -1，直接反转整个数组（相当于不变）

#### YXC 最终代码
```cpp
class Solution {
public:
    void nextPermutation(vector<int>& nums) {
        int k = nums.size() - 1;
        while (k > 0 && nums[k - 1] >= nums[k]) k -- ;
        if (k <= 0) {
            reverse(nums.begin(), nums.end());
        } else {
            int t = k;
            while (t < nums.size() && nums[t] > nums[k - 1]) t ++ ;
            swap(nums[t - 1], nums[k - 1]);                      // 交换
            reverse(nums.begin() + k, nums.end());
        }
    }
};
```


### 5. 寻找重复数（LeetCode 287 · Medium）

#### 题目

给定一个包含 n + 1 个整数的数组 nums，其数字都在 [1, n] 范围内。假设 nums 只有一个重复的整数，找出这个重复的数。

- LeetCode 题目：[打开题目](https://leetcode.cn/problems/find-the-duplicate-number/)
- AcWing 题目：[打开题目](https://www.acwing.com/activity/content/problem/content/2665/)
- AcWing yxc 代码：[打开代码](https://www.acwing.com/activity/content/code/content/456473/)
- 题目详解：[[287-寻找重复数|打开完整题解]]

#### 解题思路

**思路讲解：** 将数组看作一个隐式链表——`nums[i]` 表示节点 i 的 next 指针指向 `nums[i]`。因为有重复数字，不同的下标可能指向同一个值，所以这个链表必有环，且环的入口就是重复数。

**第一阶段：找相遇点。** 快指针每次走两步（`fast = nums[nums[fast]]`），慢指针每次走一步（`slow = nums[slow]`），它们在环中相遇。

**第二阶段：找环入口。** 将慢指针重置到起点，快慢指针都每次走一步，再次相遇的位置即为环入口（重复数）。

**为什么环的入口就是重复数？** 因为至少有两个不同的位置 `i` 和 `j` 满足 `nums[i] == nums[j] == 重复数`，这意味着从 `i` 和 `j` 出发都能到达同一个值——在链表中，这就是环的入口。

**时间复杂度：** O(n) | **空间复杂度：** O(1)

#### 易错点
- **快慢指针的初始化**：`slow = fast = nums[0]`，不要初始化为 0，因为 0 不在 `[1, n]` 范围内，可能导致索引越界
- **快慢指针的步长**：快指针走两步，必须写成 `nums[nums[fast]]` 而不是 `nums[fast] * 2` 或 `nums[fast] + 2`
- **第二阶段从 `nums[0]` 开始**：不是从 0 开始，而是从 `nums[0]` 开始（即链表头节点）
- **二分法统计时注意边界**：`cnt > mid` 是关键判断条件，不是 `cnt >= mid`。因为如果 ≤ mid 的数的个数恰好等于 mid，说明前 mid 个数各出现一次，没有重复
- **二分法的值域范围**：是 `[1, n]`，不是下标范围。`l = 1, r = len(nums) - 1`（因为 `nums` 长度为 `n+1`，最大值为 n）
- **不能使用排序**：题目要求不修改数组
- **重复多次的情况**：如 `[3,3,3,3,3]`，Floyd 判圈法和二分法都能正确处理

#### YXC 最终代码
```cpp
class Solution {
public:
    int findDuplicate(vector<int>& nums) {
        int a = 0, b = 0;
        while (true) {
            a = nums[a];
            b = nums[nums[b]];
            if (a == b) {
                a = 0;
                while (a != b) {
                    a = nums[a];
                    b = nums[b];
                }
                return a;
            }
        }

        return -1;
    }
};
```
