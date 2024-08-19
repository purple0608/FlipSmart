    #include<bits/stdc++.h>
    using namespace std;
    #include <iostream>

     vector<vector<int>> findOverlappingTimes(vector<vector<int>>& intervals) {
        sort(intervals.begin(),intervals.end());
        
        vector<vector<int>> result;
        result.push_back(intervals[0]);
        for(int i=1;i<intervals.size();i++){
            int prev_x=result.back()[0];
            int prev_y=result.back()[1];

            if(intervals[i][0]<=prev_y){
                result.back()[0]=min(result.back()[0],intervals[i][0]);
                result.back()[1]=max(result.back()[1],intervals[i][1]);
            }

            else{
                result.push_back(intervals[i]);
            }
        }

        return result;
        
    }
    int main(){
        vector<vector<int>> t;
        int n;
        cin>>n;
        for(int i=0;i<n;i++){
            int x,y;
            cin>>x>>y;
            t.push_back({x,y});
            
        }
        vector<vector<int>> result=findOverlappingTimes(t);
        for(int i=0;i<result.size();i++){
            cout<<result[i][0]<<" "<<result[i][1]<<endl;
        }

    
    return 0;
    }
   