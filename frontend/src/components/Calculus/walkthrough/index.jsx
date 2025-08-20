import React from "react";
import Joyride from "react-joyride";

const steps = [
  {
    target: ".topbar",
    content: "This is your top navigation bar.",
  },
  {
    target: ".sidebar",
    content: "This is your sidebar. You can navigate through sections here.",
  },
  {
    target: ".search-bar",
    content: "Here you can search for different stats.",
  },
  {
    target: ".salary-graph",
    content: "Here you can see the salary distribution.",
  },
  {
    target: ".expected-salary-graph",
    content: "Here you can see the expected salary distribution.",
  },
  {
    target: ".median-salary-graph",
    content: "Here you can see the median salary distribution.",
  },
  {
    target: ".diversity-graph",
    content: "Here you can see the diversity distribution.",
  },
];

const Walkthrough = ({ children, run }) => {
  const handleJoyrideCallback = (data) => {
    const { status } = data;

    if (status === "skipped") {
      console.log("Tour skipped");
    }

    if (status === "finished") {
      localStorage.setItem("walkthrough", "done");
      console.log("Tour ended");
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
        callback={handleJoyrideCallback}
        spotlightClicks
        styles={{
          options: {
            zIndex: 10000, // keeps tooltips on top
          },
        }}
      />
      {children}
    </div>
  );
};

export default Walkthrough;
