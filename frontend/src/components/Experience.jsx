import {
  CameraControls,
  ContactShadows,
  Environment,
  Text,
} from "@react-three/drei";
import { useState, useContext } from "react";
import { Suspense, useEffect, useRef } from "react";
import { useChat } from "../hooks/useChat";
import { Avatar } from "./Avatar";
import { TechAvatar } from "./TechAvatar";
import { HomeAvatar } from "./HomeAvatar";
import { GiftAvatar } from "./GiftAvatar";
import { FashionAvatar } from "./FashionAvatar";
import { AvatarContext } from "../hooks/AvatarProvider"; // Import the custom hook

const Dots = (props) => {
  const { loading } = useChat();
  const [loadingText, setLoadingText] = useState("");
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingText((loadingText) => {
          if (loadingText.length > 2) {
            return ".";
          }
          return loadingText + ".";
        });
      }, 800);
      return () => clearInterval(interval);
    } else {
      setLoadingText("");
    }
  }, [loading]);
  if (!loading) return null;
  return (
    <group {...props}>
      <Text fontSize={0.14} anchorX={"left"} anchorY={"bottom"}>
        {loadingText}
        <meshBasicMaterial attach="material" color="black" />
      </Text>
    </group>
  );
};

export const Experience = () => {
  const cameraControls = useRef();
  const { cameraZoomed } = useChat();
  const { avatar } = useContext(AvatarContext); // Use the hook to get the selected avatar
  console.log("Avatar in Experience", avatar);

  useEffect(() => {
    cameraControls.current.setLookAt(0, 2, 5, 0, 1.5, 0);
  }, []);

  useEffect(() => {
    if (cameraZoomed) {
      cameraControls.current.setLookAt(0, 1.5, 1.5, 0, 1.5, 0, true);
    } else {
      cameraControls.current.setLookAt(0, 2.2, 5, 0, 1.0, 0, true);
    }
  }, [cameraZoomed]);

  return (
    <>
      <CameraControls ref={cameraControls} />
      <Environment preset="sunset" />
      <Suspense>
        <Dots position-y={1.75} position-x={-0.02} />
      </Suspense>
      {/* Render the selected avatar */}
      {avatar === '/animations.glb' && <Avatar />}
      {avatar === '/avatar1.glb' && <TechAvatar />}
      {avatar === '/avatar2.glb' && <Avatar />}
      {avatar === '/avatar3.glb' && <FashionAvatar />}
      {avatar === '/avatar4.glb' && <GiftAvatar />}
      <ContactShadows opacity={0.7} />
    </>
  );
};
