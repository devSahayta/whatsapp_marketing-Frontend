// components/WarmupErrorModal.jsx
import React from 'react';
import { AlertTriangle, Flame, TrendingUp, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../styles/warmup-error-modal.css';

const WarmupErrorModal = ({ error, onClose }) => {
  const navigate = useNavigate();

  if (!error) return null;

  const isWarmupError = error.error?.includes('WARMUP') || error.error?.includes('TIER');
  const errorData = error;

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const getErrorTitle = () => {
    if (errorData.error === 'WARMUP_DAILY_LIMIT_EXCEEDED') {
      return 'Daily Warm-up Limit Reached';
    }
    if (errorData.error === 'WARMUP_STAGE_LIMIT_EXCEEDED') {
      return 'Warm-up Stage Limit Reached';
    }
    if (errorData.error === 'DAILY_TIER_LIMIT_EXCEEDED') {
      return 'Daily Tier Limit Reached';
    }
    if (errorData.error === 'TIER_DAILY_LIMIT_EXCEEDED') {
      return 'Tier Limit Reached';
    }
    return 'Campaign Limit Exceeded';
  };

  const getErrorIcon = () => {
    if (errorData.warmup_required) {
      return <Flame size={24} className="warmup-error-modal__icon--warmup" />;
    }
    return <AlertTriangle size={24} className="warmup-error-modal__icon--alert" />;
  };

  const handleViewAccount = () => {
    navigate('/whatsapp-account');
    onClose();
  };

  return (
    <div className="warmup-error-modal__backdrop" onClick={onClose}>
      <div className="warmup-error-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="warmup-error-modal__header">
          <div className="warmup-error-modal__icon-wrapper">
            {getErrorIcon()}
          </div>
          <button
            type="button"
            className="warmup-error-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="warmup-error-modal__content">
          <h2 className="warmup-error-modal__title">{getErrorTitle()}</h2>
          
          <div className="warmup-error-modal__message">
            {errorData.message || 'Your campaign exceeds the current sending limit.'}
          </div>

          {/* Current Stats */}
          <div className="warmup-error-modal__stats">
            {errorData.warmup_required && (
              <div className="warmup-stat">
                <span className="warmup-stat__label">Current Warm-up Stage</span>
                <span className="warmup-stat__value">
                  Stage {errorData.current_stage || 1}
                </span>
              </div>
            )}

            <div className="warmup-stat">
              <span className="warmup-stat__label">
                {errorData.warmup_required ? 'Stage Limit' : 'Tier Limit'}
              </span>
              <span className="warmup-stat__value">
                {formatNumber(errorData.current_limit || errorData.tier_daily_limit || 0)}/day
              </span>
            </div>

            <div className="warmup-stat">
              <span className="warmup-stat__label">Already Sent Today</span>
              <span className="warmup-stat__value">
                {formatNumber(errorData.daily_sent || 0)}
              </span>
            </div>

            <div className="warmup-stat">
              <span className="warmup-stat__label">Remaining Today</span>
              <span className="warmup-stat__value warmup-stat__value--highlight">
                {formatNumber(errorData.daily_remaining || 0)}
              </span>
            </div>
          </div>

          {/* What You Can Do */}
          <div className="warmup-error-modal__actions-info">
            <h3 className="warmup-error-modal__subtitle">What you can do:</h3>
            <ul className="warmup-error-modal__list">
              {errorData.daily_remaining > 0 ? (
                <li>
                  <strong>Reduce your campaign</strong> to {formatNumber(errorData.daily_remaining)} contacts or fewer
                </li>
              ) : (
                <li>
                  <strong>Wait until tomorrow</strong> - Your daily limit resets at midnight UTC
                </li>
              )}
              
              {errorData.warmup_required && errorData.next_stage && (
                <li>
                  <strong>Complete this stage</strong> to unlock {errorData.next_stage.stage 
                    ? `Stage ${errorData.next_stage.stage}` 
                    : 'higher limits'} 
                  {errorData.next_stage.limit && ` (${formatNumber(errorData.next_stage.limit)}/day)`}
                </li>
              )}
              
              <li>
                <strong>Split your campaign</strong> across multiple days
              </li>
            </ul>
          </div>

          {/* Warm-up Progress */}
          {errorData.warmup_required && errorData.warmup_limits && (
            <div className="warmup-error-modal__stages">
              <h3 className="warmup-error-modal__subtitle">
                <Flame size={16} />
                Warm-up Stages
              </h3>
              <div className="warmup-stages-list">
                {errorData.warmup_limits.map((limit, index) => {
                  const stageNum = index + 1;
                  const isCurrent = stageNum === errorData.current_stage;
                  const isCompleted = stageNum < errorData.current_stage;
                  
                  return (
                    <div 
                      key={stageNum}
                      className={`warmup-stage-chip ${
                        isCurrent ? 'warmup-stage-chip--current' : 
                        isCompleted ? 'warmup-stage-chip--completed' : 
                        'warmup-stage-chip--upcoming'
                      }`}
                    >
                      <span className="warmup-stage-chip__number">
                        Stage {stageNum}
                      </span>
                      <span className="warmup-stage-chip__limit">
                        {formatNumber(limit)}/day
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suggestion */}
          {errorData.suggestion && (
            <div className="warmup-error-modal__suggestion">
              <TrendingUp size={16} />
              <span>{errorData.suggestion}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="warmup-error-modal__footer">
          <button
            type="button"
            className="warmup-error-modal__btn warmup-error-modal__btn--secondary"
            onClick={onClose}
          >
            Got it
          </button>
          <button
            type="button"
            className="warmup-error-modal__btn warmup-error-modal__btn--primary"
            onClick={handleViewAccount}
          >
            View Account Details
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarmupErrorModal;