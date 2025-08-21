import React from "react";
import Joyride from "react-joyride";
import { useChat } from "../../../hooks/useChat";

// Detailed section information to improve explanations
const sectionsInfo = {
  "topbar": {
    name: "Navigation Bar",
    description: "The top navigation bar provides access to main menu items and global actions."
  },
  "sidebar": {
    name: "Sidebar Navigation",
    description: "The sidebar contains various sections and filters for data analysis."
  },
  "search-bar": {
    name: "Search Functionality",
    description: "The search bar allows you to quickly find specific metrics and data points."
  },
  "salary-graph": {
    name: "Salary Distribution Graph",
    description: "This graph shows the overall salary distribution across different roles and departments."
  },
  "expected-salary-graph": {
    name: "Expected Salary Forecast",
    description: "This graph displays projected salary trends based on market data and company growth."
  },
  "median-salary-graph": {
    name: "Median Salary Analysis",
    description: "The median salary graph shows central tendency metrics for compensation across teams."
  },
  "diversity-graph": {
    name: "Workforce Diversity Metrics",
    description: "This graph visualizes diversity and inclusion metrics across the organization."
  }
};

// Create steps for react-joyride using the section information
const steps = Object.entries(sectionsInfo).map(([key, info]) => ({
  target: `.${key}`,
  content: info.description,
  title: info.name,
  // Include additional data that might be helpful when explaining
  data: {
    sectionKey: key
  }
}));

const Walkthrough = ({ children, run, setRun }) => {
  const { chat } = useChat();
  const [stepIndex, setStepIndex] = React.useState(0);

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    // 1. Handle tour ending
    if (['finished', 'skipped'].includes(status)) {
      setStepIndex(0); // Reset state
      setRun(false); // Stop the tour
      localStorage.setItem('walkthrough', 'done');
      return;
    }

    // 2. Handle beacon clicks
    if (type === 'beacon') {
      const sectionInfo = sectionsInfo[steps[index].target.replace('.', '')];
      if (sectionInfo) {
        chat(`explain the ${sectionInfo.name} section in detail`);
      }
      setStepIndex(index);
      return;
    }

    // 3. Handle navigation and the initial start
    if (type === 'tour:start') {
      // When the tour starts, just set the index to 0. Do not send a message.
      // The user will initiate the first explanation via voice or beacon click.
      setStepIndex(0);
      return;
    }

    if (type === 'step:after') {
      // For subsequent steps, calculate the new index and send the explanation.
      const newIndex = index + (action === 'prev' ? -1 : 1);

      if (steps[newIndex]) {
        console.log("Explaining section:", steps[newIndex].target);
        const sectionInfo = sectionsInfo[steps[newIndex].target.replace('.', '')];
        if (sectionInfo) {
          chat(`explain the ${sectionInfo.name} section`);
        }
      }
      setStepIndex(newIndex);
    }
  };

  return (
    <div>
      <Joyride
        steps={steps}
        run={run}
        continuous
        showSkipButton
        showProgress
        stepIndex={stepIndex}
        callback={handleJoyrideCallback}
        spotlightClicks
        styles={{
          overlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 0,
          },
        }}
      />
      {children}
    </div>
  );
};

export default Walkthrough;
