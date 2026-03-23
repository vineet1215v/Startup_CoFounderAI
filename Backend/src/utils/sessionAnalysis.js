const DEFAULT_AGENT_SET = ['CEO', 'CTO', 'CFO', 'CMO', 'CPO', 'COO']

const MARKET_KEYWORDS = ['market', 'growth', 'customer', 'consumer', 'audience', 'ecommerce', 'sales']
const TECH_KEYWORDS = ['ai', 'agent', 'automation', 'platform', 'software', 'api', 'saas', 'workflow']
const FINANCE_KEYWORDS = ['pricing', 'revenue', 'subscription', 'b2b', 'margin', 'finance', 'cost']

const countMatches = (text, keywords) =>
  keywords.reduce((count, keyword) => count + (text.includes(keyword) ? 1 : 0), 0)

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export const buildSessionTitle = (ideaText) => {
  const words = ideaText
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .slice(0, 8)

  const title = words.join(' ')
  return title.length > 0 ? title : 'Untitled startup idea'
}

export const analyzeIdea = (ideaText) => {
  const normalizedText = ideaText.trim().toLowerCase()
  const wordCount = normalizedText.split(/\s+/).filter(Boolean).length

  const marketScore = clamp(5.2 + countMatches(normalizedText, MARKET_KEYWORDS) * 0.7 + wordCount / 45, 4.8, 9.3)
  const techScore = clamp(5.4 + countMatches(normalizedText, TECH_KEYWORDS) * 0.65 + wordCount / 50, 5, 9.4)
  const financeScore = clamp(4.9 + countMatches(normalizedText, FINANCE_KEYWORDS) * 0.75 + wordCount / 55, 4.5, 9.1)
  const verdict = Number(((marketScore + techScore + financeScore) / 3).toFixed(1))
  const aggregateConfidence = Number(clamp(verdict / 10, 0.45, 0.93).toFixed(2))

  const status = verdict >= 7.2 ? 'validated' : verdict >= 6 ? 'analyzing' : 'draft'
  const recommendation =
    verdict >= 7.5
      ? 'High-potential concept. Move into customer discovery and MVP scoping.'
      : verdict >= 6
        ? 'Promising but needs sharper positioning and validation before build-out.'
        : 'Interesting direction, but the core wedge and business case need more work.'

  const recommendedRaise =
    verdict >= 7.5 ? '$500k-$750k pre-seed' : verdict >= 6.5 ? '$250k-$400k angel/pre-seed' : 'Bootstrap validation first'

  return {
    marketScore: Number(marketScore.toFixed(1)),
    techScore: Number(techScore.toFixed(1)),
    financeScore: Number(financeScore.toFixed(1)),
    verdict,
    status,
    context: recommendation,
    agents: DEFAULT_AGENT_SET,
    consensus: {
      aggregateConfidence,
      recommendation,
      recommendedRaise,
    },
  }
}

export const buildSessionMessages = ({ title, ideaText, analysis }) => [
  {
    role: 'Founder',
    agentName: 'Founder',
    content: ideaText,
    messageType: 'IDEA_PROPOSED',
    metadata: {},
  },
  {
    role: 'System',
    agentName: 'CoFounder Brain',
    content: `Boardroom initialized for "${title}". The team is reviewing market, technology, and finance.`,
    messageType: 'STATUS_UPDATE',
    metadata: {},
  },
  {
    role: 'CMO',
    agentName: 'Maya',
    content: `Market view: ${analysis.context} Current market conviction is ${analysis.marketScore}/10 based on the audience and growth signals present in the idea.`,
    messageType: 'AGENT_ANALYSIS',
    metadata: { score: analysis.marketScore },
  },
  {
    role: 'CTO',
    agentName: 'Tariq',
    content: `Technical view: this can be staged into a lean MVP, with technical feasibility scored at ${analysis.techScore}/10. The priority is building the narrowest product loop first.`,
    messageType: 'AGENT_ANALYSIS',
    metadata: { score: analysis.techScore },
  },
  {
    role: 'CFO',
    agentName: 'Felix',
    content: `Financial view: feasibility is ${analysis.financeScore}/10. Early economics depend on validating willingness to pay before scaling scope.`,
    messageType: 'AGENT_ANALYSIS',
    metadata: { score: analysis.financeScore },
  },
  {
    role: 'CEO',
    agentName: 'Ava',
    content: `Consensus: ${analysis.consensus.recommendation} Suggested funding posture: ${analysis.consensus.recommendedRaise}.`,
    messageType: 'CONSENSUS_SIGNAL',
    metadata: { consensus: analysis.consensus },
  },
]

export const buildSuggestedTasks = ({ title }) => [
  {
    title: 'Interview 10 target users and document pain points',
    ownerRole: 'CMO',
    status: 'queued',
    priority: 'high',
    sessionTitle: title,
  },
  {
    title: 'Define the narrowest MVP scope and delivery timeline',
    ownerRole: 'CTO',
    status: 'active',
    priority: 'high',
    sessionTitle: title,
  },
  {
    title: 'Model pricing assumptions and first-year runway',
    ownerRole: 'CFO',
    status: 'queued',
    priority: 'medium',
    sessionTitle: title,
  },
]
