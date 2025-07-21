import React from 'react';
import { MarkdownFile } from '../App';

interface DemoModeProps {
  onSubmit: (files: MarkdownFile[]) => void;
}

const DemoMode: React.FC<DemoModeProps> = ({ onSubmit }) => {
  const generateSamplePresentation = () => {
    const sampleFiles: MarkdownFile[] = [
      {
        name: 'full_presentation.md',
        content: `# Sample Presentation: Product Strategy 2024

# Slide 1

# Welcome to Our Product Strategy

## Q1 2024 Overview

This presentation outlines our strategic direction for the upcoming quarter.

---

# Slide 2

# Market Analysis

## Current Trends

- **Digital Transformation**: 85% increase in cloud adoption
- **AI Integration**: Growing demand for intelligent solutions
- **User Experience**: Focus on seamless interactions

### Key Statistics

- Market size: $2.4B
- Growth rate: 23% YoY
- Customer satisfaction: 94%

---

# Slide 3

# Our Solution

## Product Features

1. **Smart Analytics**
   - Real-time data processing
   - Predictive insights
   - Custom dashboards

2. **Seamless Integration**
   - API-first architecture
   - Multiple platform support
   - Easy migration tools

3. **Advanced Security**
   - End-to-end encryption
   - Compliance ready
   - Regular security audits

---

# Slide 4

# Implementation Roadmap

## Phase 1: Foundation (Q1)
- Core platform development
- Basic feature set
- Initial user testing

## Phase 2: Enhancement (Q2)
- Advanced analytics
- Integration partnerships
- Expanded feature set

## Phase 3: Scale (Q3)
- Global rollout
- Enterprise features
- Performance optimization

---

# Slide 5

# Success Metrics

## Key Performance Indicators

| Metric | Target | Current |
|--------|--------|---------|
| User Adoption | 10,000 | 2,500 |
| Revenue Growth | $5M | $1.2M |
| Customer Satisfaction | 95% | 87% |
| Market Share | 15% | 8% |

## Next Steps

- Finalize Q1 deliverables
- Begin user acquisition campaign
- Establish strategic partnerships

---

*Source: Demo Content*
*Generated on ${new Date().toISOString()}*`
      },
      {
        name: 'slide_01.md',
        content: `# Slide 1

# Welcome to Our Product Strategy

## Q1 2024 Overview

This presentation outlines our strategic direction for the upcoming quarter.

---

*Source: Demo Content*
*Slide 1 of 5*`
      },
      {
        name: 'slide_02.md',
        content: `# Slide 2

# Market Analysis

## Current Trends

- **Digital Transformation**: 85% increase in cloud adoption
- **AI Integration**: Growing demand for intelligent solutions
- **User Experience**: Focus on seamless interactions

### Key Statistics

- Market size: $2.4B
- Growth rate: 23% YoY
- Customer satisfaction: 94%

---

*Source: Demo Content*
*Slide 2 of 5*`
      },
      {
        name: 'slide_03.md',
        content: `# Slide 3

# Our Solution

## Product Features

1. **Smart Analytics**
   - Real-time data processing
   - Predictive insights
   - Custom dashboards

2. **Seamless Integration**
   - API-first architecture
   - Multiple platform support
   - Easy migration tools

3. **Advanced Security**
   - End-to-end encryption
   - Compliance ready
   - Regular security audits

---

*Source: Demo Content*
*Slide 3 of 5*`
      },
      {
        name: 'slide_04.md',
        content: `# Slide 4

# Implementation Roadmap

## Phase 1: Foundation (Q1)
- Core platform development
- Basic feature set
- Initial user testing

## Phase 2: Enhancement (Q2)
- Advanced analytics
- Integration partnerships
- Expanded feature set

## Phase 3: Scale (Q3)
- Global rollout
- Enterprise features
- Performance optimization

---

*Source: Demo Content*
*Slide 4 of 5*`
      },
      {
        name: 'slide_05.md',
        content: `# Slide 5

# Success Metrics

## Key Performance Indicators

| Metric | Target | Current |
|--------|--------|---------|
| User Adoption | 10,000 | 2,500 |
| Revenue Growth | $5M | $1.2M |
| Customer Satisfaction | 95% | 87% |
| Market Share | 15% | 8% |

## Next Steps

- Finalize Q1 deliverables
- Begin user acquisition campaign
- Establish strategic partnerships

---

*Source: Demo Content*
*Slide 5 of 5*`
      }
    ];

    onSubmit(sampleFiles);
  };

  return (
    <div className="demo-mode-container">
      <div className="demo-description">
        <h3>Demo Mode</h3>
        <p>
          Try the converter with sample presentation content to see how it works.
          This demo shows what the output looks like when converting a typical 
          business presentation to markdown format.
        </p>
        
        <div className="demo-features">
          <h4>Demo includes:</h4>
          <ul>
            <li>5-slide business presentation</li>
            <li>Headers, lists, and tables</li>
            <li>Individual slide files + combined presentation</li>
            <li>Proper markdown formatting</li>
          </ul>
        </div>
      </div>
      
      <button
        className="demo-button"
        onClick={generateSamplePresentation}
      >
        Generate Sample Presentation
      </button>
    </div>
  );
};

export default DemoMode;