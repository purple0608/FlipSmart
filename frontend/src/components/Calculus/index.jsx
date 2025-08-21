import { useEffect, useState } from "react";
import { useChat } from "../../hooks/useChat";
import Dashboard from "./dashboard";
import Walkthrough from "./walkthrough";

export default function Calculus() {
  const { isDemoMode, startTour, setStartTour } = useChat();
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Set the initial state of the tour based on local storage.
    // This prevents the tour from running on every page load.
    const walkthroughDone = localStorage.getItem("walkthrough") === "done";
    setRun(!walkthroughDone);

    // In demo mode, if the tour hasn't been marked as done, mark it now.
    // This ensures the tour only runs when explicitly started by voice.
    if (isDemoMode && !walkthroughDone) {
      localStorage.setItem("walkthrough", "done");
      setRun(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    // This effect specifically handles the voice command to start the tour.
    if (startTour) {
      console.log("Start tour signal received in Calculus component. Running tour.");
      localStorage.removeItem('walkthrough'); // Ensure tour can run
      setRun(true); // Explicitly run the tour
      setStartTour(false); // Reset the trigger immediately
    }
  }, [startTour, setStartTour]);

  return (
    <Walkthrough run={run} setRun={setRun}>
      <Dashboard />
    </Walkthrough>
  );
}