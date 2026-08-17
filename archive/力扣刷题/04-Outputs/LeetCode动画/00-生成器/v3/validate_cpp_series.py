#!/usr/bin/env python3
"""Compile and run every locked YXC solution against the animation example."""
from __future__ import annotations
import concurrent.futures,importlib.util,json,shutil,subprocess,tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parent
PROJECT=ROOT.parents[3]
OLD=ROOT.parent/"generate.py"
REPORT=PROJECT/"04-Outputs"/"LeetCode动画-V3"/"Hot100"/"cpp-validation.json"

BASE=r'''#include <algorithm>
#include <array>
#include <climits>
#include <cmath>
#include <deque>
#include <functional>
#include <iostream>
#include <map>
#include <numeric>
#include <optional>
#include <queue>
#include <set>
#include <stack>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
using namespace std;
template<class T> void out(const T& x){cout<<x;}
void out(const bool& x){cout<<(x?"true":"false");}
void out(const string& x){cout<<x;}
template<class T> void out(const vector<T>& a){cout<<'[';for(size_t i=0;i<a.size();i++){if(i)cout<<',';out(a[i]);}cout<<']';}
'''
LIST=r'''struct ListNode{int val;ListNode*next;ListNode(int x=0,ListNode*n=nullptr):val(x),next(n){}};
ListNode* mk(initializer_list<int>a){ListNode d;auto*p=&d;for(int x:a)p=p->next=new ListNode(x);return d.next;}
vector<int> lv(ListNode*p){vector<int>a;for(int guard=0;p&&guard++<100;p=p->next)a.push_back(p->val);return a;}
'''
TREE=r'''struct TreeNode{int val;TreeNode*left,*right;TreeNode(int x=0):val(x),left(nullptr),right(nullptr){}};
TreeNode* tr(vector<optional<int>>a){if(a.empty()||!a[0])return nullptr;vector<TreeNode*>v(a.size());for(size_t i=0;i<a.size();i++)if(a[i])v[i]=new TreeNode(*a[i]);for(size_t i=0,j=1;j<a.size();i++)if(v[i]){if(j<a.size())v[i]->left=v[j++];if(j<a.size())v[i]->right=v[j++];}return v[0];}
vector<int> flat(TreeNode*r){vector<int>a;for(;r;r=r->right)a.push_back(r->val);return a;}
'''
RANDOM=r'''class Node{public:int val;Node*next,*random;Node(int x):val(x),next(nullptr),random(nullptr){}};
'''

def load_items():
 spec=importlib.util.spec_from_file_location("old",OLD);mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod.parse_source()

def harness(pid:int)->str:
 h={
1:'vector<int>a{2,7,11,15};out(Solution().twoSum(a,9));',49:'vector<string>a{"eat","tea","tan","ate","nat","bat"};auto r=Solution().groupAnagrams(a);for(auto&g:r)sort(g.begin(),g.end());sort(r.begin(),r.end());out(r);',128:'vector<int>a{100,4,200,1,3,2};out(Solution().longestConsecutive(a));',283:'vector<int>a{0,1,0,3,12};Solution().moveZeroes(a);out(a);',11:'vector<int>a{1,8,6,2,5,4,8,3,7};out(Solution().maxArea(a));',15:'vector<int>a{-1,0,1,2,-1,-4};auto r=Solution().threeSum(a);sort(r.begin(),r.end());out(r);',42:'vector<int>a{0,1,0,2,1,0,1,3,2,1,2,1};out(Solution().trap(a));',3:'out(Solution().lengthOfLongestSubstring("abcabcbb"));',438:'out(Solution().findAnagrams("cbaebabacd","abc"));',560:'vector<int>a{1,1,1};out(Solution().subarraySum(a,2));',239:'vector<int>a{1,3,-1,-3,5,3,6,7};out(Solution().maxSlidingWindow(a,3));',76:'out(Solution().minWindow("ADOBECODEBANC","ABC"));',53:'vector<int>a{-2,1,-3,4,-1,2,1,-5,4};out(Solution().maxSubArray(a));',56:'vector<vector<int>>a{{1,3},{2,6},{8,10},{15,18}};out(Solution().merge(a));',189:'vector<int>a{1,2,3,4,5,6,7};Solution().rotate(a,3);out(a);',238:'vector<int>a{1,2,3,4};out(Solution().productExceptSelf(a));',41:'vector<int>a{3,4,-1,1};out(Solution().firstMissingPositive(a));',73:'vector<vector<int>>a{{1,1,1},{1,0,1},{1,1,1}};Solution().setZeroes(a);out(a);',54:'vector<vector<int>>a{{1,2,3},{4,5,6},{7,8,9}};out(Solution().spiralOrder(a));',48:'vector<vector<int>>a{{1,2,3},{4,5,6},{7,8,9}};Solution().rotate(a);out(a);',240:'vector<vector<int>>a{{1,4,7,11,15},{2,5,8,12,19},{3,6,9,16,22},{10,13,14,17,24},{18,21,23,26,30}};out(Solution().searchMatrix(a,5));',
160:'auto*c=mk({8,4,5});auto*a=mk({4,1});auto*b=mk({5,6,1});auto*p=a;while(p->next)p=p->next;p->next=c;p=b;while(p->next)p=p->next;p->next=c;out(Solution().getIntersectionNode(a,b)->val);',206:'auto*a=mk({1,2,3,4,5});out(lv(Solution().reverseList(a)));',234:'auto*a=mk({1,2,2,1});out(Solution().isPalindrome(a));',141:'auto*a=mk({3,2,0,-4});auto*p=a;while(p->next)p=p->next;p->next=a->next;out(Solution().hasCycle(a));',142:'auto*a=mk({3,2,0,-4});auto*p=a;while(p->next)p=p->next;p->next=a->next;out(Solution().detectCycle(a)->val);',21:'out(lv(Solution().mergeTwoLists(mk({1,2,4}),mk({1,3,4}))));',2:'out(lv(Solution().addTwoNumbers(mk({2,4,3}),mk({5,6,4}))));',19:'out(lv(Solution().removeNthFromEnd(mk({1,2,3,4,5}),2)));',24:'out(lv(Solution().swapPairs(mk({1,2,3,4}))));',25:'out(lv(Solution().reverseKGroup(mk({1,2,3,4,5}),2)));',23:'vector<ListNode*>a{mk({1,4,5}),mk({1,3,4}),mk({2,6})};out(lv(Solution().mergeKLists(a)));',148:'out(lv(Solution().sortList(mk({4,2,1,3}))));',
146:'LRUCache c(2);c.put(1,1);c.put(2,2);cout<<c.get(1)<<",";c.put(3,3);cout<<c.get(2);',
94:'out(Solution().inorderTraversal(tr({1,nullopt,2,3})));',104:'out(Solution().maxDepth(tr({3,9,20,nullopt,nullopt,15,7})));',226:'auto*r=Solution().invertTree(tr({4,2,7,1,3,6,9}));queue<TreeNode*>q;q.push(r);vector<int>a;while(q.size()){auto*t=q.front();q.pop();a.push_back(t->val);if(t->left)q.push(t->left);if(t->right)q.push(t->right);}out(a);',101:'out(Solution().isSymmetric(tr({1,2,2,3,4,4,3})));',543:'out(Solution().diameterOfBinaryTree(tr({1,2,3,4,5})));',102:'out(Solution().levelOrder(tr({3,9,20,nullopt,nullopt,15,7})));',108:'auto*r=Solution().sortedArrayToBST(*new vector<int>{-10,-3,0,5,9});out(r->val);',98:'out(Solution().isValidBST(tr({2,1,3})));',230:'out(Solution().kthSmallest(tr({3,1,4,nullopt,2}),1));',199:'out(Solution().rightSideView(tr({1,2,3,nullopt,5,nullopt,4})));',114:'auto*r=tr({1,2,5,3,4,nullopt,6});Solution().flatten(r);out(flat(r));',105:'vector<int>p{3,9,20,15,7},i{9,3,15,20,7};auto*r=Solution().buildTree(p,i);queue<TreeNode*>q;q.push(r);vector<int>a;while(q.size()){auto*t=q.front();q.pop();a.push_back(t->val);if(t->left)q.push(t->left);if(t->right)q.push(t->right);}out(a);',437:'out(Solution().pathSum(tr({10,5,-3,3,2,nullopt,11,3,-2,nullopt,1}),8));',236:'auto*r=tr({3,5,1,6,2,0,8,nullopt,nullopt,7,4});out(Solution().lowestCommonAncestor(r,r->left,r->right)->val);',124:'out(Solution().maxPathSum(tr({-10,9,20,nullopt,nullopt,15,7})));',
200:'vector<vector<char>>a{{\'1\',\'1\',\'0\',\'0\',\'0\'},{\'1\',\'1\',\'0\',\'0\',\'0\'},{\'0\',\'0\',\'1\',\'0\',\'0\'},{\'0\',\'0\',\'0\',\'1\',\'1\'}};out(Solution().numIslands(a));',994:'vector<vector<int>>a{{2,1,1},{1,1,0},{0,1,1}};out(Solution().orangesRotting(a));',207:'vector<vector<int>>a{{1,0}};out(Solution().canFinish(2,a));',208:'Trie t;t.insert("apple");t.insert("app");cout<<t.search("app")<<","<<t.startsWith("ap");',20:'out(Solution().isValid("([{}])"));',155:'MinStack s;s.push(-2);s.push(0);s.push(-3);cout<<s.getMin()<<",";s.pop();cout<<s.getMin();',394:'out(Solution().decodeString("3[a2[c]]"));',739:'vector<int>a{73,74,75,71,69,72,76,73};out(Solution().dailyTemperatures(a));',84:'vector<int>a{2,1,5,6,2,3};out(Solution().largestRectangleArea(a));',215:'vector<int>a{3,2,1,5,6,4};out(Solution().findKthLargest(a,2));',347:'vector<int>a{1,1,1,2,2,3};auto r=Solution().topKFrequent(a,2);sort(r.begin(),r.end());out(r);',295:'MedianFinder m;m.addNum(1);cout<<m.findMedian()<<",";m.addNum(2);cout<<m.findMedian()<<",";m.addNum(3);cout<<m.findMedian();',
46:'vector<int>a{1,2,3};auto r=Solution().permute(a);sort(r.begin(),r.end());out(r);',78:'vector<int>a{1,2,3};auto r=Solution().subsets(a);sort(r.begin(),r.end());out(r);',17:'auto r=Solution().letterCombinations("23");sort(r.begin(),r.end());out(r);',39:'vector<int>a{2,3,6,7};auto r=Solution().combinationSum(a,7);for(auto&x:r)sort(x.begin(),x.end());sort(r.begin(),r.end());out(r);',22:'auto r=Solution().generateParenthesis(3);sort(r.begin(),r.end());out(r);',79:'vector<vector<char>>a{{\'A\',\'B\',\'C\',\'E\'},{\'S\',\'F\',\'C\',\'S\'},{\'A\',\'D\',\'E\',\'E\'}};out(Solution().exist(a,"ABCCED"));',131:'auto r=Solution().partition("aab");sort(r.begin(),r.end());out(r);',51:'auto r=Solution().solveNQueens(4);sort(r.begin(),r.end());cout<<r.size();',
35:'vector<int>a{1,3,5,6};out(Solution().searchInsert(a,2));',74:'vector<vector<int>>a{{1,3,5,7},{10,11,16,20},{23,30,34,60}};out(Solution().searchMatrix(a,3));',34:'vector<int>a{5,7,7,8,8,10};out(Solution().searchRange(a,8));',33:'vector<int>a{4,5,6,7,0,1,2};out(Solution().search(a,0));',153:'vector<int>a{3,4,5,1,2};out(Solution().findMin(a));',4:'vector<int>a{1,3},b{2};out(Solution().findMedianSortedArrays(a,b));',121:'vector<int>a{7,1,5,3,6,4};out(Solution().maxProfit(a));',55:'vector<int>a{2,3,1,1,4};out(Solution().canJump(a));',45:'vector<int>a{2,3,1,1,4};out(Solution().jump(a));',763:'out(Solution().partitionLabels("ababcbacadefegdehijhklij"));',70:'out(Solution().climbStairs(5));',118:'out(Solution().generate(5));',198:'vector<int>a{2,7,9,3,1};out(Solution().rob(a));',279:'out(Solution().numSquares(12));',322:'vector<int>a{1,2,5};out(Solution().coinChange(a,11));',139:'vector<string>d{"leet","code"};out(Solution().wordBreak("leetcode",d));',300:'vector<int>a{10,9,2,5,3,7,101,18};out(Solution().lengthOfLIS(a));',152:'vector<int>a{2,3,-2,4};out(Solution().maxProduct(a));',416:'vector<int>a{1,5,11,5};out(Solution().canPartition(a));',32:'out(Solution().longestValidParentheses("(()"));',62:'out(Solution().uniquePaths(3,7));',64:'vector<vector<int>>a{{1,3,1},{1,5,1},{4,2,1}};out(Solution().minPathSum(a));',5:'out(Solution().longestPalindrome("babad"));',1143:'out(Solution().longestCommonSubsequence("abcde","ace"));',72:'out(Solution().minDistance("horse","ros"));',136:'vector<int>a{4,1,2,1,2};out(Solution().singleNumber(a));',169:'vector<int>a{2,2,1,1,1,2,2};out(Solution().majorityElement(a));',75:'vector<int>a{2,0,2,1,1,0};Solution().sortColors(a);out(a);',31:'vector<int>a{1,2,3};Solution().nextPermutation(a);out(a);',287:'vector<int>a{1,3,4,2,2};out(Solution().findDuplicate(a));'
 }
 if pid==138:
  return 'Node*a=new Node(7),*b=new Node(13),*c=new Node(11),*d=new Node(10),*e=new Node(1);a->next=b;b->next=c;c->next=d;d->next=e;b->random=a;c->random=e;d->random=c;e->random=a;auto*r=Solution().copyRandomList(a);vector<int>x;for(;r;r=r->next)x.push_back(r->random?r->random->val:-1);out(x);'
 return h[pid]

EXPECTED={
1:'[0,1]',49:'[[ate,eat,tea],[bat],[nat,tan]]',128:'4',283:'[1,3,12,0,0]',11:'49',15:'[[-1,-1,2],[-1,0,1]]',42:'6',3:'3',438:'[0,6]',560:'2',239:'[3,3,5,5,6,7]',76:'BANC',53:'6',56:'[[1,6],[8,10],[15,18]]',189:'[5,6,7,1,2,3,4]',238:'[24,12,8,6]',41:'2',73:'[[1,0,1],[0,0,0],[1,0,1]]',54:'[1,2,3,6,9,8,7,4,5]',48:'[[7,4,1],[8,5,2],[9,6,3]]',240:'true',160:'8',206:'[5,4,3,2,1]',234:'true',141:'true',142:'2',21:'[1,1,2,3,4,4]',2:'[7,0,8]',19:'[1,2,3,5]',24:'[2,1,4,3]',25:'[2,1,4,3,5]',138:'[-1,7,1,11,7]',148:'[1,2,3,4]',23:'[1,1,2,3,4,4,5,6]',146:'1,-1',94:'[1,3,2]',104:'3',226:'[4,7,2,9,6,3,1]',101:'true',543:'3',102:'[[3],[9,20],[15,7]]',108:'0',98:'true',230:'1',199:'[1,3,4]',114:'[1,2,3,4,5,6]',105:'[3,9,20,15,7]',437:'3',236:'3',124:'42',200:'3',994:'4',207:'true',208:'1,1',20:'true',155:'-3,-2',394:'accaccacc',739:'[1,1,4,2,1,1,0,0]',84:'10',215:'5',347:'[1,2]',295:'1,1.5,2',46:'[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]',78:'[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]',17:'[ad,ae,af,bd,be,bf,cd,ce,cf]',39:'[[2,2,3],[7]]',22:'[((())),(()()),(())(),()(()),()()()]',79:'true',131:'[[a,a,b],[aa,b]]',51:'2',35:'1',74:'true',34:'[3,4]',33:'4',153:'1',4:'2',121:'5',55:'true',45:'2',763:'[9,7,8]',70:'8',118:'[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]',198:'12',279:'3',322:'3',139:'true',300:'4',152:'6',416:'true',32:'2',62:'28',64:'7',5:'bab',1143:'3',72:'3',136:'4',169:'2',75:'[0,0,1,1,2,2]',31:'[1,3,2]',287:'2'}

LIST_IDS={160,206,234,141,142,21,2,19,24,25,148,23}
TREE_IDS={94,104,226,101,543,102,108,98,230,199,114,105,437,236,124}
def one(item):
 pid=item['id'];prefix=BASE+(LIST if pid in LIST_IDS else '')+(TREE if pid in TREE_IDS else '')+(RANDOM if pid==138 else '')
 source=prefix+'\n'+item['code']+'\nint main(){'+harness(pid)+'}\n';compiler=shutil.which('clang++') or shutil.which('g++')
 with tempfile.TemporaryDirectory(prefix=f'lc{pid}-') as td:
  cpp=Path(td)/'main.cpp';exe=Path(td)/'main';cpp.write_text(source,encoding='utf-8')
  c=subprocess.run([compiler,'-std=c++17',str(cpp),'-O1','-o',str(exe)],capture_output=True,text=True,timeout=40)
  if c.returncode:return pid,False,'',c.stderr[-3000:]
  r=subprocess.run([str(exe)],capture_output=True,text=True,timeout=15);outv=r.stdout.strip();err=r.stderr[-1000:]
  return pid,r.returncode==0 and outv==EXPECTED[pid],outv,err if r.returncode else ('' if outv==EXPECTED[pid] else f'expected {EXPECTED[pid]}')

def main():
 items=load_items();results={}
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
  for pid,ok,stdout,error in ex.map(one,items):results[str(pid)]={'passed':ok,'stdout':stdout,'expected':EXPECTED[pid],'error':error}
 report={'passed':all(x['passed'] for x in results.values()),'total':len(results),'passedCount':sum(x['passed'] for x in results.values()),'problems':results};REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps({'passed':report['passed'],'total':report['total'],'passedCount':report['passedCount'],'failures':{k:v for k,v in results.items() if not v['passed']}},ensure_ascii=False,indent=2));raise SystemExit(0 if report['passed'] else 1)
if __name__=='__main__':main()
