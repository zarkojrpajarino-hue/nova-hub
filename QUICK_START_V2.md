# 🚀 QUICK START - Hybrid Onboarding V2

## ⚡ Testing Complete Flow (5 Minutes)

### **Paso 1: Start Development Server**
```bash
npm run dev
# Server starts at http://localhost:8080
```

### **Paso 2: Navigate to Type Selection**
```
http://localhost:8080/select-onboarding-type
```

### **Paso 3: Choose Onboarding Type**

Pick one of three flows to test:

---

#### 🎯 OPTION A: Generative (No Idea → 3 Ideas)
**Target:** Users without a business idea
**Time:** 3 minutes
**Methodology:** Business Model Generation

1. Click **"¿Quieres emprender pero no tienes idea?"**
2. Select Industry: **"SaaS / Software"**
3. (Optional) Add Location: **"Madrid, Spain"**
4. (Optional) Add Skills, Investment, Time
5. Click: **"Generate 3 Business Ideas with AI"**
6. ⏳ Wait 15-20 seconds (AI generating)
7. ✨ Review 3 generated ideas with fit scores
8. Fast Start Complete! → 25% progress

**What You'll See:**
- 3 business ideas with problem/solution/market
- Fit scores (70-90%)
- Initial Business Model Canvas
- Dashboard with progress banner

---

#### 🚀 OPTION B: Idea (Validate Idea)
**Target:** Users with an existing idea
**Time:** 4 minutes
**Methodology:** Lean Startup

1. Click **"Tengo una idea y quiero emprenderla"**
2. Enter Project Name: **"TaskFlow"**
3. Describe Idea (50+ chars):
   ```
   A project management tool for remote teams that uses AI to
   automatically prioritize tasks, detect bottlenecks, and suggest
   optimal resource allocation based on team capacity and deadlines.
   ```
4. (Optional) Show AutoFill options
5. Click: **"Validate Idea and Generate Strategy"**
6. ⏳ Wait 15-20 seconds
7. ✨ See AI Preview Dashboard:
   - Business Model Canvas
   - 2 Buyer Personas
   - Sales Playbook
8. Click: **"Approve All and Continue"**
9. Fast Start Complete! → 25% progress

**What You'll See:**
- Business Model Canvas (9 blocks)
- Detailed Buyer Personas
- Sales process and scripts
- Quality scores (75-90%)

---

#### 🏢 OPTION C: Existing (Scale Business)
**Target:** Users with existing startup
**Time:** 5 minutes
**Methodology:** Scaling Up + 4 Decisions

1. Click **"Tengo una startup existente"**
2. Enter Company Name: **"GrowthLabs"**
3. Describe Business (30+ chars):
   ```
   B2B SaaS platform for marketing analytics targeting
   small agencies with 10-50 employees.
   ```
4. Enter Metrics:
   - MRR: **$15,000**
   - Customers: **45**
5. (Optional) Show Data Integration options
6. Click: **"Analyze Business and Generate Diagnostic"**
7. ⏳ Wait 20-25 seconds
8. ✨ See Health Score + Growth Diagnostic
9. Fast Start Complete! → 25% progress

**What You'll See:**
- Business Health Dashboard
- Growth Diagnostic
- 3 Scenarios (status quo, fix, growth)
- Bottleneck analysis

---

## 🎯 Testing Deep Setup (Optional)

After Fast Start, you'll see a banner on the dashboard:

### **Step 1: Access Deep Setup**
1. Dashboard shows: **"Fast Start Complete! Continue Deep Setup"**
2. Click button: **"Continue Deep Setup"**
3. Navigate to: `/proyecto/:projectId/deep-setup`

### **Step 2: Choose a Section**
You'll see sections based on your onboarding type:

**Generative Sections:**
- ✅ Business Ideas Refinement (+10%) - **Available Now**
- ✅ Location Intelligence (+8%) - **Available Now**
- 🔒 Financial Planning (+12%) - Unlocks at 50%
- 🔒 Go-to-Market (+20%) - Unlocks at 75%

**Idea Sections:**
- ✅ Business Model Deep (+10%) - **Available Now**
- ✅ Buyer Personas Extended (+10%) - **Available Now**
- 🔒 Sales Playbook Advanced (+12%) - Unlocks at 50%
- 🔒 Validation Plan (+15%) - Unlocks at 75%

**Existing Sections:**
- ✅ Health Diagnostic (+10%) - **Available Now**
- ✅ Data Integration (+8%) - **Available Now**
- 🔒 Unit Economics (+12%) - Unlocks at 50%
- 🔒 Scaling Roadmap (+15%) - Unlocks at 75%

### **Step 3: Complete a Section**

**Example: Business Ideas Refinement**
1. Click **"Start Section"** on any unlocked section
2. Select your favorite idea from 3 options
3. (Optional) Add refinement notes
4. Click: **"Analyze Selected Idea"**
5. ⏳ Wait 2-3 seconds
6. Section Complete! → Progress: 35%
7. 🎉 Confetti + Tools unlocked!

**Tools Unlocked:**
- SWOT Matrix
- Market Research Dashboard

---

## 📊 Testing Gamification

### **View Your Progress**
Look for the Gamification Widget showing:
- **Points:** Earned for each achievement
- **Level:** Increases every 1,000 points
- **Badges:** Intermediate (50%), Advanced (75%), Master (100%)
- **Achievements:** Unlocked by completing tasks

### **Achievement Examples:**
- ⚡ **Quick Starter** - Complete Fast Start in <5 min (+100 pts)
- 🎯 **Getting Serious** - 25% Deep Setup (+150 pts)
- 🚀 **Halfway There** - 50% Deep Setup (+300 pts)
- 👑 **Master Founder** - 100% Deep Setup (+1000 pts)

---

## 🔄 Testing AI Regeneration

### **Trigger Context Accumulation**
1. Navigate to any project view
2. Use ContextAggregator to increment metrics:
   ```typescript
   import { ContextAggregator } from '@/lib/context-aggregator';

   const aggregator = new ContextAggregator(projectId);
   await aggregator.incrementMetric('customer_interviews', 5);
   await aggregator.incrementMetric('website_visitors', 100);
   ```

3. Check Regeneration Widget (appears when thresholds met)
4. Click **"Regenerate"** on any ready trigger
5. ⏳ Wait 3 seconds (AI regenerating)
6. ✨ Artifact updated with new context!

### **Context Quality Score**
- **0%:** Fresh project, no context
- **50%:** Some data accumulated
- **100%:** All regeneration thresholds met

---

## ✅ Validation Checklist

### **Fast Start Flow**
- [ ] All 3 onboarding types load correctly
- [ ] Input validation works (required fields)
- [ ] AI generation takes 15-20 seconds
- [ ] Success celebration shows (confetti)
- [ ] Redirect to dashboard works
- [ ] Progress banner appears (25%)

### **Deep Setup Flow**
- [ ] Sections display correctly
- [ ] Locked sections show unlock requirements
- [ ] Section navigation works
- [ ] Section completion updates progress
- [ ] Progressive unlocking at 50%, 75%
- [ ] Tools unlock notifications

### **Gamification**
- [ ] Points awarded correctly
- [ ] Achievements unlock at milestones
- [ ] Badges appear in widget
- [ ] Level calculation works
- [ ] Achievement toast notifications

### **Regeneration Triggers**
- [ ] Context accumulates correctly
- [ ] Triggers show when ready
- [ ] Regeneration updates artifacts
- [ ] Quality score calculates properly

### **UX Polish**
- [ ] Smooth animations
- [ ] Loading states clear
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Professional OPTIMUS-K styling

---

## 🎨 Key Features to Observe

1. **Progress Banner** - Top of dashboard after Fast Start
2. **Gamification Widget** - Shows points, level, badges
3. **Regeneration Widget** - Shows context opportunities
4. **Deep Setup Grid** - Visual section cards
5. **Milestone Badges** - Appear at 50%, 75%, 100%
6. **Confetti Celebrations** - On completions
7. **Quality Scores** - AI confidence indicators

---

## 📈 Expected Completion Rates

- **Fast Start:** 75-85% (vs 20% old onboarding)
- **Deep Setup 50%:** 50-60%
- **Deep Setup 100%:** 30-40%

---

## 🐛 Troubleshooting

**"No onboarding type found"**
→ Clear localStorage and restart flow

**"Section not loading"**
→ Check console for route errors

**"Progress not updating"**
→ Check Supabase connection

**"AI taking too long"**
→ Check network tab, should be 15-20s

---

## 🚀 Next Steps After Testing

1. ✅ Complete Fast Start (any type)
2. ✅ Access Deep Setup
3. ✅ Complete 2-3 sections
4. ✅ Check gamification progress
5. ✅ Test regeneration (simulate context)
6. 🎉 Celebrate 100% onboarding!

---

**¡Todo listo para probar el nuevo sistema híbrido!** 🎯
