// import svgPaths from "./imports/svg-ef23o47pvp";
// import imgDownload101 from "figma:asset/1eb5518c4171e0bfef47750a44f5f0a892c86a82.png";
// import imgMyPicNew1 from "figma:asset/cebba46664234ccc4d5fce9ca88c12d961a1a6ce.png";
// import { imgMyPicNew2, imgGroup } from "./imports/svg-camnu";
import { useState } from "react";
import { Menu, X, Search, Download, Share, Shield, TrendingUp } from "lucide-react";

// Reusable icon components from the original design
function DotsHorizontal() {
  return (
    <div className="size-6">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="dots-horizontal">
          <path
            clipRule="evenodd"
            d={svgPaths.p3d5ea200}
            fill="var(--fill-0, #1B2821)"
            fillRule="evenodd"
            id="Union"
          />
        </g>
      </svg>
    </div>
  );
}

function ArrowLineRight({ className = "" }) {
  return (
    <div className={`size-4 ${className}`}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="ArrowLineRight">
          <path
            clipRule="evenodd"
            d={svgPaths.pefb9580}
            fill="url(#paint0_linear_arrow)"
            fillRule="evenodd"
            id="Vector"
          />
        </g>
        <defs>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="paint0_linear_arrow"
            x1="5.5"
            x2="10.5"
            y1="3.5"
            y2="3.5"
          >
            <stop stopColor="#2A4E96" />
            <stop offset="1" stopColor="#95B6F9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Chart Components
function SalaryChart() {
  return (
    <div className="w-full h-[271px] flex gap-4">
      <div className="flex flex-col justify-between text-right text-xs text-gray-400 py-4">
        <span>30M</span>
        <span>20M</span>
        <span>10M</span>
        <span>0</span>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-px bg-gray-200" />
            ))}
          </div>
          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-between p-4 pb-7">
            {[50, 30, 45, 20, 100, 30].map((height, i) => (
              <div
                key={i}
                className="bg-gradient-to-b from-[#2a4e96] to-[#b3ccff] w-5 rounded-t"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>4-13</span>
          <span>14-23</span>
          <span>24-33</span>
          <span>44-53</span>
          <span>64-73</span>
          <span>64</span>
        </div>
      </div>
    </div>
  );
}

function MedianSalaryChart() {
  return (
    <div className="w-full h-[200px] relative bg-gray-50 rounded-lg overflow-hidden">
      {/* Bell curve visualization */}
      <div className="absolute inset-4">
        <div className="w-full h-full relative">
          {/* Grid lines */}
          <svg className="absolute inset-0" viewBox="0 0 390 164">
            <path d="M0 162.76H389.76" stroke="#E6E6E6" />
            <path d="M0 108.84H389.76" stroke="#E6E6E6" />
            <path d="M0 54.92H389.76" stroke="#E6E6E6" />
            <path d="M0 1H389.76" stroke="#E6E6E6" />
          </svg>
          {/* Bell curve */}
          <svg className="absolute inset-0" viewBox="0 0 419 190">
            <path
              d={svgPaths.p14563120}
              fill="#2A4E96"
              stroke="#F8F8F8"
              strokeWidth="2"
            />
          </svg>
          {/* Data points */}
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-md px-3 py-2 text-xs">
            <div>9 Years</div>
            <div>16.8 Lacs</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiversityChart() {
  return (
    <div className="w-full h-[200px] flex items-center justify-center">
      <div className="relative">
        {/* Male figure - 60% */}
        <div className="inline-block relative mr-8">
          <div className="w-16 h-20 bg-[#2a4e96] rounded-t-full rounded-b-sm"></div>
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-white font-bold text-lg">
            60%
          </div>
        </div>
        {/* Female figure - 40% */}
        <div className="inline-block relative">
          <div className="w-16 h-20 bg-[#b3ccff] rounded-t-full rounded-b-sm"></div>
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-white font-bold text-lg">
            40%
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filterItems = [
    "Companies Cluster",
    "Industry", 
    "Functional Area",
    "Organization",
    "Current Location",
    "Preferred Location",
    "Course Type",
    "Degree",
    "Institute", 
    "Experience",
    "Duration (Last Seen)",
    "Batch",
    "Salary",
    "Age",
    "Diversity",
    "Handled a team?",
    "Willing to relocate?",
    "Language"
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2a4e96] rounded"></div>
              <span className="font-semibold text-lg">iimjobs</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span>Predefined Queries</span>
              <ArrowLineRight className="rotate-90" />
            </div>
            
            {/* Profile */}
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
              <img 
                src={imgMyPicNew1} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#262930] text-white transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-[#b3ccff] font-semibold">Refine your Search</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {filterItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm hover:text-[#b3ccff] cursor-pointer">
                  <span>{item}</span>
                  <ArrowLineRight className="text-[#b3ccff]" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Title Section */}
          <div className="bg-white border-b border-gray-200 px-4 py-6">
            <div className="flex items-center gap-3 mb-4">
              <img src={imgDownload101} alt="Calculator" className="w-7 h-7" />
              <h1 className="text-lg font-medium text-gray-900">
                - Talent Mapping and Salary Benchmarking Tool
              </h1>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-4xl">
              <div className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-3 shadow-sm">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder='Ex: "Brand Manager" AND (FMCG OR Retail)'
                  className="flex-1 text-base text-gray-600 placeholder-gray-400 bg-transparent border-none outline-none"
                />
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-sm text-gray-600">Boolean Search</span>
                  <ArrowLineRight className="rotate-90 text-[#2a4e96]" />
                </div>
              </div>
            </div>
          </div>

          {/* Results Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-gray-900">Brand manager</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Modify</span>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <span>Explore Data</span>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <Shield className="w-4 h-4 text-[#5270c6]" />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-50">
                  <Share className="w-4 h-4" />
                  Download PDF
                </button>
                <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-50">
                  <DotsHorizontal />
                </button>
              </div>
            </div>
            
            <div className="mt-2 text-sm text-gray-500">
              <span>1 filter applied</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-blue-600 cursor-pointer hover:underline">Clear All</span>
            </div>
          </div>

          {/* Dashboard Cards */}
          <div className="p-4 space-y-6">
            {/* Top Row - Current and Expected Salary */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Current Salary Distribution */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Current Salary Distribution</h3>
                  <DotsHorizontal />
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-[#2a4e96] rounded"></div>
                    <span>Male</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-[#b3ccff] rounded"></div>
                    <span>Female</span>
                  </div>
                </div>
                
                <SalaryChart />
                
                {/* Salary Stats */}
                <div className="mt-6 space-y-4 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-semibold text-gray-700">Total</div>
                    <div className="font-semibold text-gray-700">Male</div>
                    <div className="font-semibold text-gray-700">Female</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-[#eaf1ff] px-2 py-1 rounded text-xs font-medium">Mean Salary</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>25 Lacs</div>
                      <div>25 Lacs</div>
                      <div>25 Lacs</div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <div className="bg-[#eaf1ff] px-2 py-1 rounded text-xs font-medium">Standard Deviation</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>16.2 Lacs</div>
                      <div>16.2 Lacs</div>
                      <div>16.2 Lacs</div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <div className="bg-[#eaf1ff] px-2 py-1 rounded text-xs font-medium">Percentile</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div>50th: 21 Lacs</div>
                        <div>75th: 36 lacs</div>
                        <div>90th: 45 lacs</div>
                      </div>
                      <div>
                        <div>50th: 21 Lacs</div>
                        <div>75th: 36 lacs</div>
                        <div>90th: 45 lacs</div>
                      </div>
                      <div>
                        <div>50th: 21 Lacs</div>
                        <div>75th: 36 lacs</div>
                        <div>90th: 45 lacs</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expected Salary Distribution */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Expected Salary Distribution</h3>
                  <DotsHorizontal />
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-[#2a4e96] rounded"></div>
                    <span>Male</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-[#b3ccff] rounded"></div>
                    <span>Female</span>
                  </div>
                </div>
                
                <SalaryChart />
                
                {/* Salary Stats */}
                <div className="mt-6 space-y-4 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-semibold text-gray-700">Total</div>
                    <div className="font-semibold text-gray-700">Male</div>
                    <div className="font-semibold text-gray-700">Female</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-[#eaf1ff] px-2 py-1 rounded text-xs font-medium">Mean Salary</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>25 Lacs</div>
                      <div>25 Lacs</div>
                      <div>25 Lacs</div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <div className="bg-[#eaf1ff] px-2 py-1 rounded text-xs font-medium">Standard Deviation</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>16.2 Lacs</div>
                      <div>16.2 Lacs</div>
                      <div>16.2 Lacs</div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <div className="bg-[#eaf1ff] px-2 py-1 rounded text-xs font-medium">Percentile</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div>50th: 21 Lacs</div>
                        <div>75th: 36 lacs</div>
                        <div>90th: 45 lacs</div>
                      </div>
                      <div>
                        <div>50th: 21 Lacs</div>
                        <div>75th: 36 lacs</div>
                        <div>90th: 45 lacs</div>
                      </div>
                      <div>
                        <div>50th: 21 Lacs</div>
                        <div>75th: 36 lacs</div>
                        <div>90th: 45 lacs</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expected hike indicator */}
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>8.2% average expected hike</span>
                </div>
              </div>
            </div>

            {/* Bottom Row - Median Salary and Diversity */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Median Salary */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Median Salary</h3>
                  <DotsHorizontal />
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-[#2a4e96] rounded"></div>
                    <span>Median Experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-[#95b6f9] rounded"></div>
                    <span>Median Salary</span>
                  </div>
                </div>
                
                <MedianSalaryChart />
              </div>

              {/* Diversity Distribution */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Diversity Distribution</h3>
                  <DotsHorizontal />
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-[#2a4e96] rounded"></div>
                    <span>Male</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-[#95b6f9] rounded"></div>
                    <span>Female</span>
                  </div>
                </div>
                
                <DiversityChart />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 py-6 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <nav className="flex items-center gap-6 text-sm">
            <a href="#" className="hover:text-blue-600">Home</a>
            <a href="#" className="hover:text-blue-600">Search</a>
            <a href="#" className="hover:text-blue-600">Contact</a>
            <a href="#" className="hover:text-blue-600">About Us</a>
          </nav>
          <div className="text-sm text-gray-600">
            iimjobs © 2025. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;