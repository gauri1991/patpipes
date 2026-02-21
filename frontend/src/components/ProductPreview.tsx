import { motion } from 'framer-motion';

interface ProductPreviewProps {
  type: 'search' | 'drafting' | 'analytics' | 'infringement';
  className?: string;
}

export function ProductPreview({ type, className = '' }: ProductPreviewProps) {
  const previews = {
    search: (
      <svg viewBox="0 0 200 150" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Search Interface Mockup */}
        <rect width="200" height="150" fill="#F8FAFC" rx="8"/>

        {/* Header */}
        <rect x="10" y="10" width="180" height="8" fill="#CBD5E1" rx="2"/>

        {/* Search Bar */}
        <rect x="10" y="25" width="150" height="12" fill="white" stroke="#00D9FF" strokeWidth="1.5" rx="6"/>
        <text x="15" y="32.5" fontSize="5" fill="#64748B" fontFamily="sans-serif">machine learning neural network</text>
        <circle cx="156" cy="31" r="5" fill="#00D9FF"/>

        {/* Results */}
        <g>
          {/* Result 1 */}
          <rect x="10" y="45" width="180" height="20" fill="white" rx="4"/>
          <text x="15" y="51" fontSize="4.5" fill="#0EA5E9" fontWeight="600">US10234567 - Neural Network Architecture</text>
          <rect x="15" y="56" width="160" height="2" fill="#94A3B8" rx="1"/>
          <rect x="15" y="60" width="140" height="2" fill="#94A3B8" rx="1"/>

          {/* Result 2 */}
          <rect x="10" y="70" width="180" height="20" fill="white" rx="4"/>
          <text x="15" y="76" fontSize="4.5" fill="#0EA5E9" fontWeight="600">EP3456789 - Deep Learning System</text>
          <rect x="15" y="81" width="150" height="2" fill="#94A3B8" rx="1"/>
          <rect x="15" y="85" width="130" height="2" fill="#94A3B8" rx="1"/>

          {/* Result 3 */}
          <rect x="10" y="95" width="180" height="20" fill="white" rx="4"/>
          <text x="15" y="101" fontSize="4.5" fill="#0EA5E9" fontWeight="600">WO2023/012345 - AI Training Method</text>
          <rect x="15" y="106" width="170" height="2" fill="#94A3B8" rx="1"/>
          <rect x="15" y="110" width="120" height="2" fill="#94A3B8" rx="1"/>
        </g>

        {/* AI Badge */}
        <rect x="10" y="125" width="40" height="15" fill="#00D9FF" fillOpacity="0.1" stroke="#00D9FF" strokeWidth="1" rx="7.5"/>
        <text x="30" y="135" fontSize="6" fill="#00D9FF" textAnchor="middle" fontWeight="600">AI Powered</text>
      </svg>
    ),

    drafting: (
      <svg viewBox="0 0 200 150" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Drafting Studio Mockup */}
        <rect width="200" height="150" fill="#F8FAFC" rx="8"/>

        {/* Toolbar */}
        <rect x="10" y="10" width="180" height="10" fill="white" rx="2"/>
        <rect x="15" y="13" width="6" height="4" fill="#94A3B8" rx="1"/>
        <rect x="24" y="13" width="6" height="4" fill="#94A3B8" rx="1"/>
        <rect x="33" y="13" width="6" height="4" fill="#94A3B8" rx="1"/>

        {/* Document Title */}
        <rect x="10" y="28" width="120" height="6" fill="#FF006E" rx="2"/>

        {/* Claims Section */}
        <rect x="10" y="40" width="180" height="95" fill="white" rx="4"/>

        {/* Claim 1 */}
        <text x="15" y="50" fontSize="5" fill="#FF006E" fontWeight="700">Claim 1</text>
        <rect x="15" y="53" width="165" height="2" fill="#1E293B" rx="1"/>
        <rect x="15" y="57" width="170" height="2" fill="#64748B" rx="1"/>
        <rect x="15" y="61" width="160" height="2" fill="#64748B" rx="1"/>
        <rect x="15" y="65" width="155" height="2" fill="#64748B" rx="1"/>

        {/* Claim 2 */}
        <text x="15" y="75" fontSize="5" fill="#FF006E" fontWeight="700">Claim 2</text>
        <rect x="15" y="78" width="170" height="2" fill="#1E293B" rx="1"/>
        <rect x="15" y="82" width="165" height="2" fill="#64748B" rx="1"/>
        <rect x="15" y="86" width="150" height="2" fill="#64748B" rx="1"/>

        {/* AI Suggestions */}
        <rect x="10" y="100" width="180" height="30" fill="#FF006E" fillOpacity="0.05" stroke="#FF006E" strokeWidth="1" strokeDasharray="2,2" rx="4"/>
        <text x="15" y="110" fontSize="5" fill="#FF006E" fontWeight="600">✨ AI Suggestions</text>
        <rect x="15" y="115" width="140" height="2" fill="#FF006E" fillOpacity="0.6" rx="1"/>
        <rect x="15" y="119" width="130" height="2" fill="#FF006E" fillOpacity="0.6" rx="1"/>
        <rect x="15" y="123" width="120" height="2" fill="#FF006E" fillOpacity="0.6" rx="1"/>
      </svg>
    ),

    analytics: (
      <svg viewBox="0 0 200 150" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Analytics Dashboard Mockup */}
        <rect width="200" height="150" fill="#F8FAFC" rx="8"/>

        {/* Header */}
        <rect x="10" y="10" width="100" height="6" fill="#3A86FF" rx="2"/>

        {/* Charts */}
        {/* Bar Chart */}
        <rect x="10" y="25" width="85" height="55" fill="white" rx="4"/>
        <text x="15" y="32" fontSize="4" fill="#64748B" fontWeight="600">Technology Trends</text>

        {/* Bars */}
        <rect x="15" y="60" width="8" height="15" fill="#3A86FF" rx="1"/>
        <rect x="27" y="50" width="8" height="25" fill="#00D9FF" rx="1"/>
        <rect x="39" y="55" width="8" height="20" fill="#3A86FF" rx="1"/>
        <rect x="51" y="45" width="8" height="30" fill="#00D9FF" rx="1"/>
        <rect x="63" y="58" width="8" height="17" fill="#3A86FF" rx="1"/>
        <rect x="75" y="52" width="8" height="23" fill="#00D9FF" rx="1"/>

        {/* Line Chart */}
        <rect x="105" y="25" width="85" height="55" fill="white" rx="4"/>
        <text x="110" y="32" fontSize="4" fill="#64748B" fontWeight="600">Filing Trends</text>

        {/* Line */}
        <path d="M110 70 L125 60 L140 65 L155 50 L170 55 L185 45" stroke="#3A86FF" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <circle cx="110" cy="70" r="2" fill="#3A86FF"/>
        <circle cx="125" cy="60" r="2" fill="#3A86FF"/>
        <circle cx="140" cy="65" r="2" fill="#3A86FF"/>
        <circle cx="155" cy="50" r="2" fill="#3A86FF"/>
        <circle cx="170" cy="55" r="2" fill="#3A86FF"/>
        <circle cx="185" cy="45" r="2" fill="#3A86FF"/>

        {/* Metrics Cards */}
        <rect x="10" y="90" width="55" height="25" fill="white" rx="4"/>
        <text x="15" y="98" fontSize="4" fill="#64748B">Active Patents</text>
        <text x="15" y="107" fontSize="10" fill="#1E293B" fontWeight="700">1,234</text>
        <text x="15" y="115" fontSize="4" fill="#10B981">↑ 12%</text>

        <rect x="72" y="90" width="55" height="25" fill="white" rx="4"/>
        <text x="77" y="98" fontSize="4" fill="#64748B">White Space</text>
        <text x="77" y="107" fontSize="10" fill="#1E293B" fontWeight="700">23</text>
        <text x="77" y="115" fontSize="4" fill="#3A86FF">Opportunities</text>

        <rect x="135" y="90" width="55" height="25" fill="white" rx="4"/>
        <text x="140" y="98" fontSize="4" fill="#64748B">Competitors</text>
        <text x="140" y="107" fontSize="10" fill="#1E293B" fontWeight="700">45</text>
        <text x="140" y="115" fontSize="4" fill="#F59E0B">Tracked</text>
      </svg>
    ),

    infringement: (
      <svg viewBox="0 0 200 150" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Infringement Analyzer Mockup */}
        <rect width="200" height="150" fill="#F8FAFC" rx="8"/>

        {/* Header */}
        <rect x="10" y="10" width="120" height="6" fill="#FFD60A" rx="2"/>
        <text x="12" y="15" fontSize="5" fill="#8B7205" fontWeight="600">10-Phase Analysis Workflow</text>

        {/* Claim Chart */}
        <rect x="10" y="25" width="180" height="50" fill="white" rx="4"/>
        <text x="15" y="32" fontSize="4" fill="#64748B" fontWeight="600">Claim Element Mapping</text>

        {/* Table Header */}
        <rect x="15" y="38" width="50" height="8" fill="#FFD60A" fillOpacity="0.2" rx="1"/>
        <text x="18" y="43" fontSize="3.5" fill="#8B7205" fontWeight="600">Claim Element</text>

        <rect x="70" y="38" width="50" height="8" fill="#FFD60A" fillOpacity="0.2" rx="1"/>
        <text x="73" y="43" fontSize="3.5" fill="#8B7205" fontWeight="600">Product Feature</text>

        <rect x="125" y="38" width="60" height="8" fill="#FFD60A" fillOpacity="0.2" rx="1"/>
        <text x="128" y="43" fontSize="3.5" fill="#8B7205" fontWeight="600">Evidence</text>

        {/* Table Rows */}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x="15" y={48 + i * 8} width="50" height="7" fill="white" stroke="#E2E8F0" strokeWidth="0.5"/>
            <rect x="18" y={50 + i * 8} width="40" height="2" fill="#94A3B8" rx="1"/>

            <rect x="70" y={48 + i * 8} width="50" height="7" fill="white" stroke="#E2E8F0" strokeWidth="0.5"/>
            <rect x="73" y={50 + i * 8} width="35" height="2" fill="#94A3B8" rx="1"/>

            <rect x="125" y={48 + i * 8} width="60" height="7" fill="white" stroke="#E2E8F0" strokeWidth="0.5"/>
            <circle cx="130" cy={51.5 + i * 8} r="2" fill="#10B981"/>
          </g>
        ))}

        {/* Evidence Section */}
        <rect x="10" y="85" width="180" height="55" fill="white" rx="4"/>
        <text x="15" y="92" fontSize="4" fill="#64748B" fontWeight="600">Evidence Collection</text>

        {/* Evidence Items */}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x="15" y={98 + i * 12} width="165" height="10" fill="#F1F5F9" rx="2"/>
            <rect x="20" y={100 + i * 12} width="4" height="6" fill="#FFD60A" rx="1"/>
            <rect x="28" y={101 + i * 12} width="80" height="2" fill="#1E293B" rx="1"/>
            <rect x="28" y={105 + i * 12} width="100" height="1.5" fill="#64748B" rx="0.75"/>
            <rect x="155" y={101 + i * 12} width="20" height="5" fill="#10B981" fillOpacity="0.1" stroke="#10B981" strokeWidth="0.5" rx="2.5"/>
            <text x="165" y={105 + i * 12} fontSize="3" fill="#10B981" textAnchor="middle" fontWeight="600">Verified</text>
          </g>
        ))}
      </svg>
    ),
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full"
    >
      {previews[type]}
    </motion.div>
  );
}
