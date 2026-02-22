import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  DollarSign,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  Building2,
  MapPin,
  Clock,
  Filter,
  Zap,
  ArrowRight,
  Target,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  FileText,
  Globe,
} from 'lucide-react';

interface CRMPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  value: number;
  stage: string;
  owner: string;
  source: string;
  lastContact: string;
}

export const CRMPreviewModal = ({ open, onOpenChange }: CRMPreviewModalProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [_selectedLead, setSelectedLead] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const totalSlides = 7;

  const leads: Lead[] = [
    { id: '1', name: 'Sarah Johnson', email: 'sarah@techcorp.com', company: 'TechCorp Inc', value: 45000, stage: 'lead', owner: 'John Smith', source: 'Website', lastContact: '2h ago' },
    { id: '2', name: 'Michael Chen', email: 'mchen@innovate.io', company: 'Innovate.io', value: 89000, stage: 'qualified', owner: 'Emma Davis', source: 'Referral', lastContact: '1d ago' },
    { id: '3', name: 'Lisa Anderson', email: 'lisa@global-ventures.com', company: 'Global Ventures', value: 125000, stage: 'proposal', owner: 'John Smith', source: 'LinkedIn', lastContact: '3h ago' },
    { id: '4', name: 'David Brown', email: 'dbrown@enterprise.com', company: 'Enterprise Solutions', value: 210000, stage: 'closed', owner: 'Emma Davis', source: 'Cold Email', lastContact: '5d ago' },
    { id: '5', name: 'Emily Wilson', email: 'emily@startup-hub.com', company: 'Startup Hub', value: 38000, stage: 'lead', owner: 'Mike Johnson', source: 'Website', lastContact: '4h ago' },
    { id: '6', name: 'Robert Taylor', email: 'rtaylor@cloudify.com', company: 'Cloudify Systems', value: 156000, stage: 'qualified', owner: 'John Smith', source: 'Conference', lastContact: '2d ago' },
    { id: '7', name: 'Jennifer Lee', email: 'jlee@datastream.com', company: 'DataStream Corp', value: 95000, stage: 'proposal', owner: 'Emma Davis', source: 'Partner', lastContact: '1d ago' },
    { id: '8', name: 'James Martinez', email: 'jmartinez@nexgen.com', company: 'NexGen Technologies', value: 178000, stage: 'closed', owner: 'Mike Johnson', source: 'Referral', lastContact: '7d ago' },
  ];

  const stages = [
    { id: 'lead', name: 'New Lead', color: 'from-blue-500/20 to-blue-600/20', borderColor: 'border-blue-500/30', count: 12 },
    { id: 'qualified', name: 'Qualified', color: 'from-purple-500/20 to-purple-600/20', borderColor: 'border-purple-500/30', count: 15 },
    { id: 'proposal', name: 'Proposal', color: 'from-orange-500/20 to-orange-600/20', borderColor: 'border-orange-500/30', count: 8 },
    { id: 'closed', name: 'Closed Won', color: 'from-green-500/20 to-green-600/20', borderColor: 'border-green-500/30', count: 13 },
  ];

  const activities = [
    { id: '1', type: 'email', title: 'Email sent to Sarah Johnson', time: '2 hours ago', icon: Mail, color: 'text-blue-400' },
    { id: '2', type: 'call', title: 'Call with Michael Chen - 45 min', time: '5 hours ago', icon: Phone, color: 'text-green-400' },
    { id: '3', type: 'meeting', title: 'Demo meeting with Lisa Anderson', time: '1 day ago', icon: Calendar, color: 'text-purple-400' },
    { id: '4', type: 'email', title: 'Proposal sent to DataStream Corp', time: '1 day ago', icon: FileText, color: 'text-orange-400' },
    { id: '5', type: 'call', title: 'Follow-up call with Robert Taylor', time: '2 days ago', icon: Phone, color: 'text-green-400' },
    { id: '6', type: 'meeting', title: 'Contract signing with Enterprise Solutions', time: '5 days ago', icon: CheckCircle2, color: 'text-emerald-400' },
  ];

  const integrations = [
    { name: 'HubSpot', icon: Globe, status: 'Connected', synced: '2,450 contacts', color: 'from-orange-500 to-orange-600' },
    { name: 'Salesforce', icon: Globe, status: 'Connected', synced: '1,820 leads', color: 'from-blue-500 to-blue-600' },
    { name: 'Pipedrive', icon: Globe, status: 'Connected', synced: '890 deals', color: 'from-green-500 to-green-600' },
    { name: 'Gmail', icon: Mail, status: 'Active', synced: '15,230 emails', color: 'from-red-500 to-red-600' },
    { name: 'Outlook', icon: Mail, status: 'Active', synced: '8,940 emails', color: 'from-blue-600 to-blue-700' },
    { name: 'Slack', icon: MessageSquare, status: 'Connected', synced: 'Real-time notifications', color: 'from-purple-500 to-purple-600' },
  ];

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div
              className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl"
            >
              <Users className="w-12 h-12 text-white" />
            </div>

            <h2
              className="text-5xl font-bold text-white mb-4"
            >
              CRM Global Enterprise
            </h2>

            <p
              className="text-xl text-gray-400 mb-12 max-w-2xl"
            >
              Complete lead management and pipeline tracking system with advanced analytics and integrations
            </p>

            <div
              className="grid grid-cols-3 gap-8 w-full max-w-4xl"
            >
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">48</div>
                <div className="text-gray-400">Active Leads</div>
              </div>

              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">$1.2M</div>
                <div className="text-gray-400">Pipeline Value</div>
              </div>

              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">32%</div>
                <div className="text-gray-400">Conversion Rate</div>
              </div>
            </div>

            <div
              className="mt-12 flex items-center gap-2 text-gray-400"
            >
              <ArrowRight className="w-5 h-5" />
              <span>Explore the full CRM experience</span>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="flex flex-col p-8">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-white mb-2">Pipeline View</h3>
              <p className="text-gray-400">Drag and drop leads across stages to update their status</p>
            </div>

            <div className="flex-1 overflow-x-auto">
              <div className="flex gap-4 h-full min-w-max pb-4">
                {stages.map((stage) => (
                  <div
                    key={stage.id}
                    className={`flex-1 min-w-[280px] bg-gradient-to-br ${stage.color} rounded-2xl border ${stage.borderColor} p-4 flex flex-col`}
                    onMouseEnter={() => setSelectedStage(stage.id)}
                    onMouseLeave={() => setSelectedStage(null)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{stage.name}</h4>
                        <p className="text-sm text-gray-400">{stage.count} leads</p>
                      </div>
                      <div className="text-2xl font-bold text-white opacity-50">{stage.count}</div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3">
                      {leads
                        .filter(lead => lead.stage === stage.id)
                        .map((lead) => (
                          <div
                            key={lead.id}
                            className={`bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 cursor-pointer transition-all hover:border-gray-600 hover:shadow-lg ${
                              selectedStage === stage.id ? 'scale-105' : ''
                            }`}
                            onClick={() => setSelectedLead(lead.id)}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h5 className="font-semibold text-white mb-1">{lead.name}</h5>
                                <p className="text-sm text-gray-400">{lead.company}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-400">
                                  ${(lead.value / 1000).toFixed(0)}K
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{lead.owner}</span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{lead.lastContact}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2: {
        const detailLead = leads[2];
        return (
          <div className="flex p-8 gap-6">
            <div
              className="flex-1 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6 overflow-y-auto"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-2xl font-bold text-white">
                  {detailLead.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-1">{detailLead.name}</h3>
                  <p className="text-gray-400 mb-2">{detailLead.company}</p>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium border border-orange-500/30">
                      Proposal Stage
                    </span>
                    <span className="text-2xl font-bold text-green-400">${(detailLead.value / 1000).toFixed(0)}K</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-white">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <span>{detailLead.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <Phone className="w-5 h-5 text-green-400" />
                      <span>+1 (555) 123-4567</span>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <Building2 className="w-5 h-5 text-purple-400" />
                      <span>{detailLead.company}</span>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <MapPin className="w-5 h-5 text-orange-400" />
                      <span>San Francisco, CA</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">Deal Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Owner</p>
                      <p className="text-white font-medium">{detailLead.owner}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Source</p>
                      <p className="text-white font-medium">{detailLead.source}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Last Contact</p>
                      <p className="text-white font-medium">{detailLead.lastContact}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Expected Close</p>
                      <p className="text-white font-medium">Q1 2026</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">Notes</h4>
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                    <p className="text-gray-300 leading-relaxed">
                      Interested in enterprise plan with custom integrations. Discussed pricing and implementation timeline.
                      Follow-up meeting scheduled for next week to present final proposal.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="w-80 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6 overflow-y-auto"
            >
              <h4 className="text-lg font-semibold text-white mb-4">Activity Timeline</h4>
              <div className="space-y-4">
                {[
                  { action: 'Proposal sent', time: '3 hours ago', icon: FileText, color: 'text-orange-400' },
                  { action: 'Demo meeting completed', time: '2 days ago', icon: Calendar, color: 'text-purple-400' },
                  { action: 'Email sent', time: '3 days ago', icon: Mail, color: 'text-blue-400' },
                  { action: 'Discovery call - 30 min', time: '5 days ago', icon: Phone, color: 'text-green-400' },
                  { action: 'Lead qualified', time: '1 week ago', icon: CheckCircle2, color: 'text-emerald-400' },
                  { action: 'Initial contact', time: '2 weeks ago', icon: AlertCircle, color: 'text-yellow-400' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 items-start"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-900/80 flex items-center justify-center border border-gray-700/50 flex-shrink-0">
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{item.action}</p>
                      <p className="text-gray-500 text-xs">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 3:
        return (
          <div className="flex flex-col p-8">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-white mb-2">Advanced Filters</h3>
              <p className="text-gray-400">Filter and segment your leads with precision</p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: 'New Lead', value: 'lead', icon: Target, color: 'from-blue-500/20 to-blue-600/20' },
                { label: 'Qualified', value: 'qualified', icon: CheckCircle2, color: 'from-purple-500/20 to-purple-600/20' },
                { label: 'Proposal', value: 'proposal', icon: FileText, color: 'from-orange-500/20 to-orange-600/20' },
                { label: 'High Value ($100K+)', value: 'high-value', icon: DollarSign, color: 'from-green-500/20 to-green-600/20' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => toggleFilter(filter.value)}
                  className={`bg-gradient-to-br ${filter.color} rounded-xl p-4 border transition-all ${
                    activeFilters.includes(filter.value)
                      ? 'border-white/30 shadow-lg scale-105'
                      : 'border-gray-700/30 hover:border-gray-600'
                  }`}
                >
                  <filter.icon className={`w-6 h-6 mb-2 ${activeFilters.includes(filter.value) ? 'text-white' : 'text-gray-400'}`} />
                  <div className={`text-sm font-medium ${activeFilters.includes(filter.value) ? 'text-white' : 'text-gray-400'}`}>
                    {filter.label}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700/50"
              >
                <label className="text-sm font-medium text-gray-400 mb-2 block">Owner</label>
                <select className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                  <option>All Owners</option>
                  <option>John Smith</option>
                  <option>Emma Davis</option>
                  <option>Mike Johnson</option>
                </select>
              </div>

              <div
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700/50"
              >
                <label className="text-sm font-medium text-gray-400 mb-2 block">Source</label>
                <select className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                  <option>All Sources</option>
                  <option>Website</option>
                  <option>Referral</option>
                  <option>LinkedIn</option>
                  <option>Cold Email</option>
                </select>
              </div>
            </div>

            <div
              className="flex-1 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">
                  Filtered Results ({activeFilters.length > 0 ? '12' : '48'} leads)
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Filter className="w-4 h-4" />
                  <span>{activeFilters.length} active filters</span>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[400px] space-y-2">
                {leads.slice(0, 6).map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30 hover:border-gray-600 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-sm font-bold text-white">
                          {lead.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h5 className="font-medium text-white">{lead.name}</h5>
                          <p className="text-sm text-gray-400">{lead.company}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-400">${(lead.value / 1000).toFixed(0)}K</div>
                        <div className="text-xs text-gray-500">{lead.stage}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col p-8">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-white mb-2">Analytics & Insights</h3>
              <p className="text-gray-400">Track performance and forecast revenue</p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Pipeline', value: '$1.2M', change: '+12%', icon: DollarSign, color: 'from-green-500/20 to-green-600/20' },
                { label: 'Conversion Rate', value: '32%', change: '+5%', icon: TrendingUp, color: 'from-blue-500/20 to-blue-600/20' },
                { label: 'Avg Deal Size', value: '$25K', change: '+8%', icon: Target, color: 'from-purple-500/20 to-purple-600/20' },
                { label: 'Win Rate', value: '68%', change: '+3%', icon: CheckCircle2, color: 'from-orange-500/20 to-orange-600/20' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 border border-gray-700/30`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className="w-6 h-6 text-white" />
                    <span className="text-sm text-green-400 font-medium">{stat.change}</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6 flex-1">
              <div
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6"
              >
                <h4 className="text-lg font-semibold text-white mb-4">Conversion Funnel</h4>
                <div className="space-y-4">
                  {[
                    { stage: 'New Leads', count: 48, percentage: 100, color: 'bg-blue-500' },
                    { stage: 'Qualified', count: 35, percentage: 73, color: 'bg-purple-500' },
                    { stage: 'Proposal', count: 22, percentage: 46, color: 'bg-orange-500' },
                    { stage: 'Closed Won', count: 15, percentage: 31, color: 'bg-green-500' },
                  ].map((stage) => (
                    <div
                      key={stage.stage}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{stage.stage}</span>
                        <span className="text-gray-400">{stage.count} ({stage.percentage}%)</span>
                      </div>
                      <div className="h-3 bg-gray-900/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${stage.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6"
              >
                <h4 className="text-lg font-semibold text-white mb-4">Revenue Forecast</h4>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-2">$384K</div>
                    <p className="text-gray-400">Expected Revenue (Q1 2026)</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { month: 'January', amount: 125, probability: 85 },
                      { month: 'February', amount: 142, probability: 70 },
                      { month: 'March', amount: 117, probability: 60 },
                    ].map((forecast) => (
                      <div
                        key={forecast.month}
                        className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{forecast.month}</span>
                          <span className="text-green-400 font-bold">${forecast.amount}K</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-900/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                            />
                          </div>
                          <span className="text-sm text-gray-400">{forecast.probability}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="flex flex-col p-8">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-white mb-2">Activity Timeline</h3>
              <p className="text-gray-400">Track all interactions and engagement across your pipeline</p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Emails Sent', value: '234', icon: Mail, color: 'from-blue-500/20 to-blue-600/20' },
                { label: 'Calls Made', value: '67', icon: Phone, color: 'from-green-500/20 to-green-600/20' },
                { label: 'Meetings', value: '42', icon: Calendar, color: 'from-purple-500/20 to-purple-600/20' },
                { label: 'Tasks Done', value: '189', icon: CheckCircle2, color: 'from-orange-500/20 to-orange-600/20' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 border border-gray-700/30`}
                >
                  <stat.icon className="w-6 h-6 text-white mb-2" />
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>

            <div
              className="flex-1 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6 overflow-hidden"
            >
              <div className="h-full overflow-y-auto space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30 hover:border-gray-600 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border border-gray-700/50 flex-shrink-0">
                        <activity.icon className={`w-5 h-5 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-white mb-1">{activity.title}</h5>
                        <p className="text-sm text-gray-400">{activity.time}</p>
                      </div>
                      <button className="text-gray-500 hover:text-gray-400 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Additional activities */}
                {[
                  { type: 'email', title: 'Automated follow-up sent to 8 leads', time: '1 week ago', icon: Mail, color: 'text-blue-400' },
                  { type: 'meeting', title: 'Team pipeline review meeting', time: '1 week ago', icon: Calendar, color: 'text-purple-400' },
                  { type: 'call', title: 'Cold call to Innovate.io', time: '2 weeks ago', icon: Phone, color: 'text-green-400' },
                ].map((activity, idx) => (
                  <div
                    key={`extra-${idx}`}
                    className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30 hover:border-gray-600 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border border-gray-700/50 flex-shrink-0">
                        <activity.icon className={`w-5 h-5 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-white mb-1">{activity.title}</h5>
                        <p className="text-sm text-gray-400">{activity.time}</p>
                      </div>
                      <button className="text-gray-500 hover:text-gray-400 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <div
              className="text-center mb-12"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Powerful Integrations</h3>
              <p className="text-gray-400">Connect with your favorite tools and platforms</p>
            </div>

            <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
              {integrations.map((integration) => (
                <div
                  key={integration.name}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6 hover:border-gray-600 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${integration.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <integration.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-1">{integration.name}</h4>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-sm text-green-400">{integration.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">{integration.synced}</div>
                </div>
              ))}
            </div>

            <div
              className="mt-12 text-center"
            >
              <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold hover:shadow-lg hover:scale-105 transition-all">
                Connect New Integration
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-black">
        <VisuallyHidden>
          <DialogTitle>CRM Global Enterprise Preview</DialogTitle>
          <DialogDescription>
            Interactive preview of the CRM Global Enterprise system
          </DialogDescription>
        </VisuallyHidden>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 p-6 bg-gradient-to-b from-gray-900/95 to-transparent backdrop-blur-sm border-b border-gray-800/50">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">CRM Global Enterprise</h2>
              <p className="text-sm text-gray-400">Complete Lead Management System</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain max-h-[calc(90vh-180px)]">
            {renderSlide()}
          </div>

          {/* Footer Navigation */}
          <div className="p-6 bg-gradient-to-t from-gray-900/95 to-transparent backdrop-blur-sm border-t border-gray-800/50">
            <div className="flex items-center justify-between">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-white transition-all border border-gray-700/50"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalSlides }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentSlide
                        ? 'w-8 bg-gradient-to-r from-blue-500 to-purple-600'
                        : 'w-2 bg-gray-700 hover:bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={currentSlide === totalSlides - 1 ? () => onOpenChange(false) : nextSlide}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:scale-105 rounded-xl text-white font-semibold transition-all"
              >
                {currentSlide === totalSlides - 1 ? (
                  <>
                    <span>Finish</span>
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

