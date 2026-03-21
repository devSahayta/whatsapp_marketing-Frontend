// components/WarmupGuideSection.jsx
import React, { useState } from 'react';
import { 
  Flame, 
  TrendingUp, 
  Shield, 
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';
import "../../styles/warmup-guide.css";

const WarmupGuideSection = ({ currentStage, warmupCompleted, tier }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const tierLimits = {
    'TIER_250': { limit: 250, stages: [50, 150, 250] },
    'TIER_1K': { limit: 1000, stages: [200, 500, 1000] },
    'TIER_1000': { limit: 1000, stages: [200, 500, 1000] },
    'TIER_2K': { limit: 2000, stages: [400, 1200, 2000] },
    'TIER_10K': { limit: 10000, stages: null },
    'TIER_100K': { limit: 100000, stages: null },
  };

  const currentTierData = tierLimits[tier] || { limit: 0, stages: null };
  const requiresWarmup = currentTierData.stages !== null;

  return (
    <section className="warmup-guide">
      <div className="warmup-guide__header">
        <div className="warmup-guide__header-content">
          <h2 className="warmup-guide__title">
            <Flame size={24} className="warmup-guide__title-icon" />
            Understanding Warm-up & Messaging Tiers
          </h2>
          <p className="warmup-guide__subtitle">
            Learn how warm-up stages and tier limits protect your account and improve delivery rates
          </p>
        </div>
      </div>

      {/* What is Warm-up */}
      <div className="warmup-guide__section">
        <button
          type="button"
          className="warmup-guide__section-header"
          onClick={() => toggleSection('what')}
        >
          <div className="warmup-guide__section-title">
            <AlertCircle size={20} />
            <span>What is Account Warm-up?</span>
          </div>
          {expandedSection === 'what' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSection === 'what' && (
          <div className="warmup-guide__section-content">
            <p>
              Account warm-up is a <strong>gradual process</strong> of increasing your daily sending volume to build trust with WhatsApp. 
              Think of it like warming up before exercise - you don't start at full intensity!
            </p>

            <div className="warmup-guide__benefits">
              <h4>Why Warm-up Matters:</h4>
              <ul>
                <li>
                  <CheckCircle2 size={16} className="warmup-guide__check" />
                  <div>
                    <strong>Prevents Account Bans</strong>
                    <span>Sending too many messages immediately looks suspicious to WhatsApp</span>
                  </div>
                </li>
                <li>
                  <CheckCircle2 size={16} className="warmup-guide__check" />
                  <div>
                    <strong>Improves Delivery Rates</strong>
                    <span>Gradual increase = higher trust = better delivery (95%+ vs 70%)</span>
                  </div>
                </li>
                <li>
                  <CheckCircle2 size={16} className="warmup-guide__check" />
                  <div>
                    <strong>Maintains Quality Rating</strong>
                    <span>Keeps your account in "GREEN" status with WhatsApp</span>
                  </div>
                </li>
                <li>
                  <CheckCircle2 size={16} className="warmup-guide__check" />
                  <div>
                    <strong>Industry Best Practice</strong>
                    <span>All professional platforms (Twilio, MessageBird) use warm-up</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* How it Works */}
      {requiresWarmup && (
        <div className="warmup-guide__section">
          <button
            type="button"
            className="warmup-guide__section-header"
            onClick={() => toggleSection('how')}
          >
            <div className="warmup-guide__section-title">
              <TrendingUp size={20} />
              <span>How Does Warm-up Work?</span>
            </div>
            {expandedSection === 'how' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {expandedSection === 'how' && (
            <div className="warmup-guide__section-content">
              <p>
                Your account progresses through <strong>{currentTierData.stages.length} warm-up stages</strong>, 
                gradually increasing your daily sending limit:
              </p>

              <div className="warmup-guide__stages">
                {currentTierData.stages.map((limit, index) => {
                  const stageNum = index + 1;
                  const isCurrent = stageNum === currentStage && !warmupCompleted;
                  const isCompleted = stageNum < currentStage || warmupCompleted;

                  return (
                    <div 
                      key={stageNum}
                      className={`warmup-guide__stage ${
                        isCurrent ? 'warmup-guide__stage--current' :
                        isCompleted ? 'warmup-guide__stage--completed' :
                        'warmup-guide__stage--upcoming'
                      }`}
                    >
                      <div className="warmup-guide__stage-header">
                        <div className="warmup-guide__stage-badge">
                          Stage {stageNum}
                        </div>
                        <div className="warmup-guide__stage-limit">
                          {limit.toLocaleString('en-IN')}/day
                        </div>
                      </div>
                      <div className="warmup-guide__stage-desc">
                        {stageNum === 1 && 'Start slow - Build initial trust'}
                        {stageNum === 2 && 'Increase volume - Establish pattern'}
                        {stageNum === 3 && 'Full capacity - Warm-up complete!'}
                      </div>
                      {isCurrent && (
                        <div className="warmup-guide__stage-current-badge">
                          You are here
                        </div>
                      )}
                      {isCompleted && (
                        <div className="warmup-guide__stage-completed-badge">
                          <CheckCircle2 size={14} />
                          Completed
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="warmup-guide__example">
                <h4>📅 Example Timeline:</h4>
                <div className="warmup-guide__timeline">
                  <div className="warmup-guide__timeline-item">
                    <strong>Day 1:</strong> Send {currentTierData.stages[0].toLocaleString('en-IN')} messages → Complete Stage 1
                  </div>
                  <div className="warmup-guide__timeline-item">
                    <strong>Day 2:</strong> Send {currentTierData.stages[1].toLocaleString('en-IN')} messages → Complete Stage 2
                  </div>
                  <div className="warmup-guide__timeline-item">
                    <strong>Day 3:</strong> Send {currentTierData.stages[2].toLocaleString('en-IN')} messages → Warm-up Complete! 🎉
                  </div>
                  <div className="warmup-guide__timeline-item">
                    <strong>Day 4+:</strong> Send up to {currentTierData.limit.toLocaleString('en-IN')} messages/day at full capacity
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily Limits */}
      <div className="warmup-guide__section">
        <button
          type="button"
          className="warmup-guide__section-header"
          onClick={() => toggleSection('limits')}
        >
          <div className="warmup-guide__section-title">
            <Clock size={20} />
            <span>Daily Limits & Reset</span>
          </div>
          {expandedSection === 'limits' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSection === 'limits' && (
          <div className="warmup-guide__section-content">
            <p>
              Daily limits ensure you don't exceed safe sending volumes in a 24-hour period.
            </p>

            <div className="warmup-guide__limit-info">
              <div className="warmup-guide__limit-card">
                <h4>⏰ When Limits Reset</h4>
                <p>
                  Your daily counter automatically resets at <strong>midnight UTC</strong> each day. 
                  This happens automatically - no action needed!
                </p>
              </div>

              <div className="warmup-guide__limit-card">
                <h4>📊 Multiple Campaigns Same Day</h4>
                <p>
                  If you create multiple campaigns in one day, they <strong>count toward the same daily limit</strong>. 
                  Example: If your limit is 400/day and you've sent 300, you can only send 100 more today.
                </p>
              </div>

              <div className="warmup-guide__limit-card">
                <h4>🎯 After Warm-up Completes</h4>
                <p>
                  Even after completing warm-up, your <strong>tier limit still applies</strong>. 
                  For Tier {tier?.replace('TIER_', '')}, you can send up to {currentTierData.limit.toLocaleString('en-IN')} messages per day.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* What Happens */}
      <div className="warmup-guide__section">
        <button
          type="button"
          className="warmup-guide__section-header"
          onClick={() => toggleSection('happens')}
        >
          <div className="warmup-guide__section-title">
            <Shield size={20} />
            <span>What Happens If I Exceed Limits?</span>
          </div>
          {expandedSection === 'happens' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSection === 'happens' && (
          <div className="warmup-guide__section-content">
            <div className="warmup-guide__alert warmup-guide__alert--safe">
              <Zap size={20} />
              <div>
                <h4>Good News: We Protect You!</h4>
                <p>
                  Our system <strong>automatically blocks</strong> campaigns that exceed your current limit. 
                  You'll see a clear error message with:
                </p>
                <ul>
                  <li>How many messages you can send today</li>
                  <li>How many you've already sent</li>
                  <li>Suggestions to fix the issue</li>
                  <li>When your limit resets</li>
                </ul>
              </div>
            </div>

            <div className="warmup-guide__scenarios">
              <h4>Common Scenarios:</h4>
              
              <div className="warmup-guide__scenario">
                <div className="warmup-guide__scenario-header">
                  <strong>Scenario 1:</strong> Campaign exceeds stage limit
                </div>
                <div className="warmup-guide__scenario-content">
                  <p><strong>What you'll see:</strong> "Stage 1 allows 400 contacts. Your campaign has 500."</p>
                  <p><strong>What to do:</strong> Reduce to 400 contacts or wait until Stage 2 unlocks</p>
                </div>
              </div>

              <div className="warmup-guide__scenario">
                <div className="warmup-guide__scenario-header">
                  <strong>Scenario 2:</strong> Multiple campaigns exceed daily limit
                </div>
                <div className="warmup-guide__scenario-content">
                  <p><strong>What you'll see:</strong> "Daily limit: 300/400 sent. Remaining: 100."</p>
                  <p><strong>What to do:</strong> Reduce campaign to 100 or wait until tomorrow</p>
                </div>
              </div>

              <div className="warmup-guide__scenario">
                <div className="warmup-guide__scenario-header">
                  <strong>Scenario 3:</strong> After warm-up, tier limit applies
                </div>
                <div className="warmup-guide__scenario-content">
                  <p><strong>What you'll see:</strong> "Tier limit: 1500/2000. Remaining: 500."</p>
                  <p><strong>What to do:</strong> You can send 500 more today, or wait for reset</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Best Practices */}
      <div className="warmup-guide__section">
        <button
          type="button"
          className="warmup-guide__section-header"
          onClick={() => toggleSection('tips')}
        >
          <div className="warmup-guide__section-title">
            <TrendingUp size={20} />
            <span>Best Practices & Tips</span>
          </div>
          {expandedSection === 'tips' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSection === 'tips' && (
          <div className="warmup-guide__section-content">
            <div className="warmup-guide__tips">
              <div className="warmup-guide__tip">
                <div className="warmup-guide__tip-icon">✅</div>
                <div>
                  <strong>Be Patient</strong>
                  <p>Warm-up takes 3-4 days. Rushing it risks account bans.</p>
                </div>
              </div>

              <div className="warmup-guide__tip">
                <div className="warmup-guide__tip-icon">📅</div>
                <div>
                  <strong>Plan Ahead</strong>
                  <p>Schedule campaigns considering your current stage limits.</p>
                </div>
              </div>

              <div className="warmup-guide__tip">
                <div className="warmup-guide__tip-icon">📊</div>
                <div>
                  <strong>Monitor Progress</strong>
                  <p>Check this page regularly to see your current stage and limits.</p>
                </div>
              </div>

              <div className="warmup-guide__tip">
                <div className="warmup-guide__tip-icon">🔄</div>
                <div>
                  <strong>Split Large Campaigns</strong>
                  <p>Divide big campaigns across multiple days to stay within limits.</p>
                </div>
              </div>

              <div className="warmup-guide__tip">
                <div className="warmup-guide__tip-icon">🎯</div>
                <div>
                  <strong>Quality Over Quantity</strong>
                  <p>Better to send fewer messages with high delivery than mass send with bans.</p>
                </div>
              </div>

              <div className="warmup-guide__tip">
                <div className="warmup-guide__tip-icon">⏰</div>
                <div>
                  <strong>Remember Reset Time</strong>
                  <p>Daily limits reset at midnight UTC (5:30 AM IST).</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default WarmupGuideSection;