import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- Sprite Configuration ---
const SPRITE_SRC = '/assets/goose_sprite.png';
const FRAME_WIDTH = 115;
const FRAME_HEIGHT = 130;
const MOVE_SPEED = 4;

// --- Content Configuration ---
const IDLE_TOOLTIPS = [
  '摸摸我?', '嘎?', '今天有什么安排呀?', '发呆中, 勿扰...', '瞅啥呢?', '嘎嘎嘎!', '需要我帮你做点什么吗?', 'zzzZZZ...',
  '思考鹅生...', '你的日程看起来好满哦', '肚肚饿了, 有小鱼干吗?', '那个按钮看起来很好玩...', '给你比个心 ❤️', '今天天气真好, 适合出门...哦我出不去',
];
const ACTIVE_TOOLTIPS = [
  '芜湖, 起飞!', '走咯, 走咯!', '看我M字抖动!', '要去哪儿呢...', '别挡道!', '嘎——!', '我可不是一只普通的鹅!',
  '冲鸭!', '风驰电掣——!', '我就是这条gai最靓的仔!', '快看我! 我在发光!', '有紧急任务!', '根本停不下来~',
];

// --- Animation Definitions ---
const ANIMATIONS = {
  WALK_RIGHT: { frames: 4, framesPerRow: 4, speed: 100, yOffset: (7 - 1) * FRAME_HEIGHT },
  WALK_LEFT: { frames: 4, framesPerRow: 4, speed: 100, yOffset: (6 - 1) * FRAME_HEIGHT },
  FLY_RIGHT: { frames: 10, framesPerRow: 10, speed: 100, yOffset: (12 - 1) * FRAME_HEIGHT },
  FLY_LEFT: { frames: 10, framesPerRow: 10, speed: 100, yOffset: (13 - 1) * FRAME_HEIGHT },
  IDLE: { frames: 4, framesPerRow: 4, yOffset: (8 - 1) * FRAME_HEIGHT },
};

type GooseState = 'IDLE' | 'WALK_LEFT' | 'WALK_RIGHT' | 'FLY_LEFT' | 'FLY_RIGHT';

const Goose: React.FC = () => {
  const [position, setPosition] = useState({
    top: window.innerHeight - FRAME_HEIGHT - 20,
    left: Math.random() * (window.innerWidth - FRAME_WIDTH),
  });
  const [state, setState] = useState<GooseState>('IDLE');
  const [animationFrame, setAnimationFrame] = useState(0);
  const [idlePose, setIdlePose] = useState(() => Math.floor(Math.random() * ANIMATIONS.IDLE.frames));
  const [tooltipText, setTooltipText] = useState(IDLE_TOOLTIPS[0]);

  // Animation loop for ACTIVE states
  useEffect(() => {
    if (state === 'IDLE') return;
    const currentAnimation = ANIMATIONS[state];
    const animationInterval = setInterval(() => {
      setAnimationFrame((prevFrame) => (prevFrame + 1) % currentAnimation.frames);
    }, currentAnimation.speed);
    return () => clearInterval(animationInterval);
  }, [state]);

  // Movement loop for ACTIVE states
  useEffect(() => {
    if (state === 'IDLE') return;
    const moveInterval = setInterval(() => {
      setPosition((prevPos) => {
        let newLeft = prevPos.left;
        let newTop = prevPos.top;
        if (state === 'WALK_LEFT') newLeft -= MOVE_SPEED;
        if (state === 'WALK_RIGHT') newLeft += MOVE_SPEED;
        if (state === 'FLY_LEFT') { newLeft -= MOVE_SPEED * 2; newTop -= MOVE_SPEED * 0.5; }
        if (state === 'FLY_RIGHT') { newLeft += MOVE_SPEED * 2; newTop -= MOVE_SPEED * 0.5; }
        if (newLeft > window.innerWidth - FRAME_WIDTH) newLeft = window.innerWidth - FRAME_WIDTH;
        if (newLeft < 0) newLeft = 0;
        return { top: newTop, left: newLeft };
      });
    }, 50);
    return () => clearInterval(moveInterval);
  }, [state]);

  // --- Event Handlers ---

  const handleClick = () => {
    if (state === 'IDLE') {
      // Logic to START an action
      const rand = Math.random();
      const direction = Math.random() > 0.5 ? 'right' : 'left';
      setAnimationFrame(0);
      const returnToIdle = (isFlying = false) => {
        if (isFlying) {
          setPosition({
              top: window.innerHeight - FRAME_HEIGHT - 20,
              left: Math.random() * (window.innerWidth - FRAME_WIDTH),
          });
        }
        setIdlePose(Math.floor(Math.random() * ANIMATIONS.IDLE.frames));
        setState('IDLE');
        // CRITICAL: Reset tooltip when becoming idle
        setTooltipText(IDLE_TOOLTIPS[Math.floor(Math.random() * IDLE_TOOLTIPS.length)]);
      };
      if (rand < 0.2) {
        const flyState: GooseState = direction === 'right' ? 'FLY_RIGHT' : 'FLY_LEFT';
        setState(flyState);
        setTimeout(() => returnToIdle(true), 6000);
      } else {
        const walkState: GooseState = direction === 'right' ? 'WALK_RIGHT' : 'WALK_LEFT';
        setState(walkState);
        setTimeout(() => returnToIdle(false), 5000);
      }
    } else {
      // Logic to INTERACT while active
      const randomIndex = Math.floor(Math.random() * ACTIVE_TOOLTIPS.length);
      setTooltipText(ACTIVE_TOOLTIPS[randomIndex]);
    }
  };

  const handleMouseEnter = () => {
    // Only update tooltip on hover if the goose is idle
    if (state === 'IDLE') {
      const randomIndex = Math.floor(Math.random() * IDLE_TOOLTIPS.length);
      setTooltipText(IDLE_TOOLTIPS[randomIndex]);
    }
  };

  // --- Calculate background position ---
  let backgroundPositionX: number, backgroundPositionY: number;
  if (state === 'IDLE') {
    const idleAnim = ANIMATIONS.IDLE;
    const col = idlePose % idleAnim.framesPerRow;
    const row = Math.floor(idlePose / idleAnim.framesPerRow);
    backgroundPositionX = -(col * FRAME_WIDTH);
    backgroundPositionY = -(row * FRAME_HEIGHT) - idleAnim.yOffset;
  } else {
    const currentAnimation = ANIMATIONS[state];
    const col = animationFrame % currentAnimation.framesPerRow;
    const row = Math.floor(animationFrame / currentAnimation.framesPerRow);
    backgroundPositionX = -(col * FRAME_WIDTH);
    backgroundPositionY = -(row * FRAME_HEIGHT) - currentAnimation.yOffset;
  }

  const gooseStyle: React.CSSProperties = {
    position: 'fixed', top: `${position.top}px`, left: `${position.left}px`,
    width: `${FRAME_WIDTH}px`, height: `${FRAME_HEIGHT}px`,
    backgroundImage: `url(${SPRITE_SRC})`,
    backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
    zIndex: 1000, userSelect: 'none', cursor: 'pointer', imageRendering: 'pixelated',
  };

  return <div style={gooseStyle} title={tooltipText} onClick={handleClick} onMouseEnter={handleMouseEnter}></div>;
};

export default Goose;