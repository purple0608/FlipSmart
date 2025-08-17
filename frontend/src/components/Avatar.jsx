import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { button, useControls } from "leva";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useChat } from "../hooks/useChat";

const facialExpressions = {
  default: {},
  smile: {
    browInnerUp: 0.17,
    eyeSquintLeft: 0.4,
    eyeSquintRight: 0.44,
    noseSneerLeft: 0.17,
    noseSneerRight: 0.14,
    mouthPressLeft: 0.61,
    mouthPressRight: 0.41,
  },
  funnyFace: {
    jawLeft: 0.63,
    mouthPucker: 0.53,
    noseSneerLeft: 1,
    noseSneerRight: 0.39,
    mouthLeft: 1,
    eyeLookUpLeft: 1,
    eyeLookUpRight: 1,
    cheekPuff: 0.9999924982764238,
    mouthDimpleLeft: 0.414743888682652,
    mouthRollLower: 0.32,
    mouthSmileLeft: 0.355,
    mouthSmileRight: 0.355,
  },
  sad: {
    mouthFrownLeft: 1,
    mouthFrownRight: 1,
    mouthShrugLower: 0.78341,
    browInnerUp: 0.452,
    eyeSquintLeft: 0.72,
    eyeSquintRight: 0.75,
    eyeLookDownLeft: 0.5,
    eyeLookDownRight: 0.5,
    jawForward: 1,
  },
  surprised: {
    eyeWideLeft: 0.5,
    eyeWideRight: 0.5,
    jawOpen: 0.351,
    mouthFunnel: 1,
    browInnerUp: 1,
  },
  angry: {
    browDownLeft: 1,
    browDownRight: 1,
    eyeSquintLeft: 1,
    eyeSquintRight: 1,
    jawForward: 1,
    jawLeft: 1,
    mouthShrugLower: 1,
    noseSneerLeft: 1,
    noseSneerRight: 0.42,
    eyeLookDownLeft: 0.16,
    eyeLookDownRight: 0.16,
    cheekSquintLeft: 1,
    cheekSquintRight: 1,
    mouthClose: 0.23,
    mouthFunnel: 0.63,
    mouthDimpleRight: 1,
  },
  crazy: {
    browInnerUp: 0.9,
    jawForward: 1,
    noseSneerLeft: 0.57,
    noseSneerRight: 0.51,
    eyeLookDownLeft: 0.394,
    eyeLookUpRight: 0.404,
    eyeLookInLeft: 0.962,
    eyeLookInRight: 0.962,
    jawOpen: 0.962,
    mouthDimpleLeft: 0.962,
    mouthDimpleRight: 0.962,
    mouthStretchLeft: 0.279,
    mouthStretchRight: 0.289,
    mouthSmileLeft: 0.558,
    mouthSmileRight: 0.385,
    tongueOut: 0.962,
  },
};

const corresponding = {
  A: "viseme_PP",
  B: "viseme_kk",
  C: "viseme_I",
  D: "viseme_AA",
  E: "viseme_O",
  F: "viseme_U",
  G: "viseme_FF",
  H: "viseme_TH",
  X: "viseme_PP",
};

let setupMode = false;

export function Avatar(props) {
  // const { nodes, materials, scene } = useGLTF("/models/64f1a714fe61576b46f27ca2.glb");
  const { nodes, materials, scene } = useGLTF("/models/avatar2.glb");
  const { message, onMessagePlayed, chat } = useChat();
  const [lipsync, setLipsync] = useState();
  const [audio, setAudio] = useState();
  const [blink, setBlink] = useState(false);
  const [winkLeft, setWinkLeft] = useState(false);
  const [winkRight, setWinkRight] = useState(false);
  const [facialExpression, setFacialExpression] = useState("");
  const [animation, setAnimation] = useState("Idle");
  
  // References for animation control
  const group = useRef();
  const mouthAnimationRef = useRef(null);
  const { actions, mixer } = useAnimations(useGLTF("/models/animations.glb").animations, group);
  
  // Start mouth animation with controlled cycle for speaking
  const startMouthAnimation = () => {
    // Check if animation is already running
    if (mouthAnimationRef.current) {
      console.log("Mouth animation already running");
      return;
    }
    
    console.log("Starting mouth animation");
    let animationStep = 0;
    let frameId = null;
    let hasMouthSmile = false;
    
    // Check if mouthSmile morph target exists
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        if (child.morphTargetDictionary["mouthSmile"] !== undefined) {
          hasMouthSmile = true;
        }
      }
    });
    
    // Define the mouth positions cycle
    const mouthPositions = [
      { open: 0.1, smile: 0.2, duration: 180 },  // Nearly closed
      { open: 0.5, smile: 0.3, duration: 120 },   // Half open
      { open: 0.8, smile: 0.25, duration: 150 },  // Wide open
      { open: 0.3, smile: 0.35, duration: 100 },  // Partially open
    ];
    
    // Add some natural random variation to each cycle
    const addVariation = () => {
      return mouthPositions.map(pos => ({
        open: pos.open * (0.8 + Math.random() * 0.4),  // 80% to 120% of original
        smile: pos.smile * (0.9 + Math.random() * 0.2), // 90% to 110% of original
        duration: pos.duration * (0.9 + Math.random() * 0.2) // 90% to 110% of original
      }));
    };
    
    let positions = addVariation();
    let lastUpdateTime = Date.now();
    let currentDuration = positions[0].duration;
    
    // The animation function
    const animate = () => {
      const now = Date.now();
      const elapsed = now - lastUpdateTime;
      
      // Time to move to next position?
      if (elapsed > currentDuration) {
        animationStep = (animationStep + 1) % positions.length;
        lastUpdateTime = now;
        
        // Every 4 positions (1 full cycle), add variation
        if (animationStep === 0) {
          positions = addVariation();
        }
        
        currentDuration = positions[animationStep].duration;
      }
      
      // Calculate how far we are through the current position (0 to 1)
      const progress = Math.min(1.0, elapsed / currentDuration);
      
      // Current position values
      const current = positions[animationStep];
      const next = positions[(animationStep + 1) % positions.length];
      
      // Interpolate between current and next position
      const openAmount = current.open + (next.open - current.open) * progress;
      const smileAmount = current.smile + (next.smile - current.smile) * progress;
      
      // Apply morphs with slow transitions for smoothness
      lerpMorphTarget("mouthOpen", openAmount, 0.3);
      if (hasMouthSmile) {
        lerpMorphTarget("mouthSmile", smileAmount, 0.5);
      }
      
      // Continue animation
      frameId = requestAnimationFrame(animate);
    };
    
    // Start the animation
    frameId = requestAnimationFrame(animate);
    
    // Save the cancel function to the ref
    mouthAnimationRef.current = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
      
      // Reset mouth morphs gradually
      lerpMorphTarget("mouthOpen", 0, 0.3);
      if (hasMouthSmile) {
        lerpMorphTarget("mouthSmile", 0.1, 0.5);
      }
    };
  };
  
  // Stop mouth animation
  const stopMouthAnimation = () => {
    if (mouthAnimationRef.current) {
      console.log("Stopping mouth animation");
      mouthAnimationRef.current();
      mouthAnimationRef.current = null;
    }
  };

  useEffect(() => {
    console.log(message);
    if (!message) {
      setAnimation("Idle");
      return;
    }
    setAnimation(message.animation);
    setFacialExpression(message.facialExpression);
    setLipsync(message.lipsync);
    console.log("Message in avatar:", message.text);
    
    // Skip if no audio data
    if (!message.audio) {
      console.error("No audio data in message");
      onMessagePlayed(); // Move on immediately if no audio
      return;
    }
    
    console.log("Creating audio element with data length:", message.audio.length);
    const audioElement = new Audio("data:audio/mp3;base64," + message.audio);
    setAudio(audioElement);
    
    // Default audio settings
    audioElement.volume = 1.0;
    
    // Print available morph targets for debugging
    console.log("Available morph targets:", Object.keys(nodes.EyeLeft.morphTargetDictionary || {}));
    console.log("Available morph targets (Wolf3D_Head):", 
      nodes.Wolf3D_Head ? Object.keys(nodes.Wolf3D_Head.morphTargetDictionary || {}) : "No Wolf3D_Head found");
    
    try {
      // IMPORTANT: Only set up lip sync AFTER audio starts playing
      let isAudioPlaying = false;
      let mouthAnimationActive = false;
      
      // Make sure we detect when audio is actually playing
      audioElement.addEventListener('playing', () => {
        console.log("Audio is now playing");
        isAudioPlaying = true;
      });
      
      // IMPORTANT: Start playing the audio FIRST
      console.log("Attempting to play audio...");
      audioElement.play().catch(err => {
        console.error("Audio play failed:", err);
        onMessagePlayed(); // Move on if audio fails
        return;
      });
    
      // Find which mouth morphs we can use
      const hasMouthOpen = nodes.Wolf3D_Head && nodes.Wolf3D_Head.morphTargetDictionary && 
                          nodes.Wolf3D_Head.morphTargetDictionary["mouthOpen"] !== undefined;
      const hasMouthSmile = nodes.Wolf3D_Head && nodes.Wolf3D_Head.morphTargetDictionary && 
                           nodes.Wolf3D_Head.morphTargetDictionary["mouthSmile"] !== undefined;
      
      console.log("Available morphs - mouthOpen:", hasMouthOpen, "mouthSmile:", hasMouthSmile);
      
      if (!hasMouthOpen) {
        // If we don't have mouth morphs, just play the audio
        audioElement.onended = onMessagePlayed;
        return;
      }
    
    // Reference to the cancellation function for any active animation
    let cancelCurrentAnimation = null;
    
    // Function to animate a talk cycle with controlled timing
    const animateTalkCycle = () => {
      // Cancel any existing animation
      if (cancelCurrentAnimation) {
        cancelCurrentAnimation();
        cancelCurrentAnimation = null;
      }
      
      // Current position in animation sequence
      let animationStep = 0;
      let frameId = null;
      
      // Define 4 different mouth positions to cycle between
      // with slightly different timing to feel natural
      const mouthPositions = [
        { open: 0.1, smile: 0.2, duration: 180 },   // Nearly closed
        { open: 0.5, smile: 0.3, duration: 120 },   // Half open
        { open: 0.8, smile: 0.25, duration: 150 },  // Wide open
        { open: 0.3, smile: 0.35, duration: 100 },  // Partially open
      ];
      
      // Add some natural random variation to each cycle
      const addVariation = () => {
        return mouthPositions.map(pos => ({
          open: pos.open * (0.8 + Math.random() * 0.4),  // 80% to 120% of original
          smile: pos.smile * (0.9 + Math.random() * 0.2), // 90% to 110% of original
          duration: pos.duration * (0.9 + Math.random() * 0.2) // 90% to 110% of original
        }));
      };
      
      let positions = addVariation();
      let lastUpdateTime = Date.now();
      let currentDuration = positions[0].duration;
      
      // The animation function
      const animate = () => {
        const now = Date.now();
        const elapsed = now - lastUpdateTime;
        
        // Time to move to next position?
        if (elapsed > currentDuration) {
          animationStep = (animationStep + 1) % positions.length;
          lastUpdateTime = now;
          
          // Every 4 positions (1 full cycle), add variation
          if (animationStep === 0) {
            positions = addVariation();
          }
          
          currentDuration = positions[animationStep].duration;
        }
        
        // Calculate how far we are through the current position (0 to 1)
        const progress = Math.min(1.0, elapsed / currentDuration);
        
        // Current position values
        const current = positions[animationStep];
        const next = positions[(animationStep + 1) % positions.length];
        
        // Interpolate between current and next position
        const openAmount = current.open + (next.open - current.open) * progress;
        const smileAmount = current.smile + (next.smile - current.smile) * progress;
        
        // Apply morphs with slow transitions for smoothness
        lerpMorphTarget("mouthOpen", openAmount, 0.3);
        if (hasMouthSmile) {
          lerpMorphTarget("mouthSmile", smileAmount, 0.5);
        }
        
        // Continue animation
        frameId = requestAnimationFrame(animate);
      };
      
      // Start the animation
      frameId = requestAnimationFrame(animate);
      
      // Return a function that cancels this animation
      return () => {
        if (frameId) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }
      };
    };
    
    // Only start animation when we confirm audio is playing
    audioElement.addEventListener('playing', () => {
      if (!mouthAnimationActive) {
        console.log("Audio playing confirmed - starting mouth animation");
        mouthAnimationActive = true;
        cancelCurrentAnimation = animateTalkCycle();
      }
    });
    
    // Also stop animation if audio is paused
    audioElement.addEventListener('pause', () => {
      if (cancelCurrentAnimation) {
        console.log("Audio paused - stopping mouth animation");
        cancelCurrentAnimation();
        cancelCurrentAnimation = null;
        mouthAnimationActive = false;
      }
    });
    
    // Also monitor for audio errors
    audioElement.addEventListener('error', (e) => {
      console.error("Audio error:", e);
      onMessagePlayed(); // Move on if audio fails
    });
    
    // Set up audio ended callback with explicit logging
    audioElement.addEventListener('ended', () => {
      console.log("Audio ended event fired");
      
      // Stop the talk animation
      if (cancelCurrentAnimation) {
        console.log("Stopping mouth animation");
        cancelCurrentAnimation();
        cancelCurrentAnimation = null;
      }
      
      // Reset mouth morphs
      lerpMorphTarget("mouthOpen", 0, 0.3);
      if (hasMouthSmile) {
        lerpMorphTarget("mouthSmile", 0.1, 0.5);
      }
      
      // Small delay before calling onMessagePlayed to ensure animations finish
      setTimeout(() => {
        onMessagePlayed();
      }, 300);
    });
    
    // Cleanup function with explicit stopping of mouth animations
    return () => {
      // Stop any animations immediately
      if (cancelCurrentAnimation) {
        console.log("Component cleanup - stopping all animations");
        cancelCurrentAnimation();
        cancelCurrentAnimation = null;
      }
      
      // Reset mouth morphs
      lerpMorphTarget("mouthOpen", 0, 0.1);
      if (hasMouthSmile) {
        lerpMorphTarget("mouthSmile", 0, 0.1);
      }
      
      // Clean up audio with explicit handling
      if (audioElement) {
        console.log("Stopping audio playback during cleanup");
        audioElement.pause();
        audioElement.currentTime = 0;
        
        // Remove all event listeners
        audioElement.onended = null;
        audioElement.onpause = null;
        audioElement.onplaying = null;
        audioElement.onerror = null;
      }
    };
    } catch (err) {
      console.error("Error setting up lip sync:", err);
      // Fall back to simple audio playback without lip sync
      audioElement.play().catch(e => console.error("Fallback audio play failed:", e));
      audioElement.onended = onMessagePlayed;
    }
  }, [message, onMessagePlayed, nodes, scene]);

  useEffect(() => {
    const currentAction = actions[animation];

    if (currentAction) {
      currentAction
        .reset()
        .fadeIn(mixer.stats.actions.inUse === 0 ? 0 : 0.5)
        .play();

      return () => {
        if (currentAction) {
          currentAction.fadeOut(0.5);
        }
      };
    } else {
      console.warn(`Animation ${animation} not found.`);
    }
  }, [animation, actions, mixer]);

  const lerpMorphTarget = (target, value, speed = 0.1) => {
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const index = child.morphTargetDictionary[target];
        if (index === undefined || child.morphTargetInfluences[index] === undefined) {
          return;
        }
        child.morphTargetInfluences[index] = THREE.MathUtils.lerp(child.morphTargetInfluences[index], value, speed);

        if (!setupMode) {
          try {
            set({
              [target]: value,
            });
          } catch (e) {
            console.error(`Error setting morph target ${target}:`, e);
          }
        }
      }
    });
  };

  useFrame(() => {
    if (!setupMode) {
      Object.keys(nodes.EyeLeft.morphTargetDictionary).forEach((key) => {
        const mapping = facialExpressions[facialExpression];
        if (key === "eyeBlinkLeft" || key === "eyeBlinkRight") {
          return; // eyes wink/blink are handled separately
        }
        if (mapping && mapping[key]) {
          lerpMorphTarget(key, mapping[key], 0.1);
        } else {
          lerpMorphTarget(key, 0, 0.1);
        }
      });

      lerpMorphTarget("eyeBlinkLeft", blink || winkLeft ? 1 : 0, 0.5);
      lerpMorphTarget("eyeBlinkRight", blink || winkRight ? 1 : 0, 0.5);

      // LIPSYNC
      if (setupMode) {
        return;
      }

      const appliedMorphTargets = [];
      if (message && lipsync) {
        const currentAudioTime = audio.currentTime;
        for (let i = 0; i < lipsync.mouthCues.length; i++) {
          const mouthCue = lipsync.mouthCues[i];
          if (currentAudioTime >= mouthCue.start && currentAudioTime <= mouthCue.end) {
            appliedMorphTargets.push(corresponding[mouthCue.value]);
            lerpMorphTarget(corresponding[mouthCue.value], 1, 0.2);
            break;
          }
        }
      }

      Object.values(corresponding).forEach((value) => {
        if (!appliedMorphTargets.includes(value)) {
          lerpMorphTarget(value, 0, 0.1);
        }
      });
    }
  });

  useControls("FacialExpressions", {
    chat: button(() => chat()),
    winkLeft: button(() => {
      setWinkLeft(true);
      setTimeout(() => setWinkLeft(false), 300);
    }),
    winkRight: button(() => {
      setWinkRight(true);
      setTimeout(() => setWinkRight(false), 300);
    }),
    animation: {
      value: animation,
      options: Object.keys(actions),
      onChange: (value) => setAnimation(value),
    },
    facialExpression: {
      options: Object.keys(facialExpressions),
      onChange: (value) => setFacialExpression(value),
    },
    enableSetupMode: button(() => {
      setupMode = true;
    }),
    disableSetupMode: button(() => {
      setupMode = false;
    }),
    logMorphTargetValues: button(() => {
      const emotionValues = {};
      Object.keys(nodes.EyeLeft.morphTargetDictionary).forEach((key) => {
        if (key === "eyeBlinkLeft" || key === "eyeBlinkRight") {
          return; // eyes wink/blink are handled separately
        }
        const value =
          nodes.EyeLeft.morphTargetInfluences[
            nodes.EyeLeft.morphTargetDictionary[key]
          ];
        if (value > 0.01) {
          emotionValues[key] = value;
        }
      });
      console.log(JSON.stringify(emotionValues, null, 2));
    }),
  });

  const [, set] = useControls("MorphTarget", () =>
    Object.assign(
      {},
      ...Object.keys(nodes.EyeLeft.morphTargetDictionary).map((key) => {
        return {
          [key]: {
            label: key,
            value: 0,
            min: nodes.EyeLeft.morphTargetInfluences[
              nodes.EyeLeft.morphTargetDictionary[key]
            ],
            max: 1,
            onChange: (val) => {
              if (setupMode) {
                lerpMorphTarget(key, val, 1);
              }
            },
          },
        };
      })
    )
  );

  useEffect(() => {
    let blinkTimeout;
    const nextBlink = () => {
      blinkTimeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          nextBlink();
        }, 200);
      }, THREE.MathUtils.randInt(1000, 5000));
    };
    nextBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  return (
    <group {...props} dispose={null} ref={group}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        name="Wolf3D_Body"
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Outfit_Bottom"
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Outfit_Footwear"
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Outfit_Top"
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Hair"
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materials.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
    </group>
  );
}

useGLTF.preload("/models/64f1a714fe61576b46f27ca2.glb");
useGLTF.preload("/models/animations.glb");
