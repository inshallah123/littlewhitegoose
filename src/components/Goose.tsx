import React, { useState, useEffect, useRef } from 'react';

// --- Sprite Configuration ---
const SPRITE_SRC = '/assets/goose_sprite.png';
const FRAME_WIDTH = 115;
const FRAME_HEIGHT = 130;
const MOVE_SPEED = 4;

// --- Content Configuration ---
const IDLE_TOOLTIPS = [
  // 经典款
  '摸摸鹅?', '嘎?', '今天有什么安排呀?', '发呆中, 勿扰...', '瞅啥呢?', '嘎嘎嘎!', 'zzzZZZ...', '给你比个心 ❤️',
  // 文学鹅
  '屏幕上看不见翅膀的痕迹，但鹅已经飞过。', '世界这么大，鹅想去看看...你的C盘。', '你看屏幕的眼神，像极了夏天的晚风。',
  // 哲学鹅
  '一只鹅的宇宙，就是屏幕的边界吗？', '如果鹅一直向左走，会回到原来的位置吗？', '你是在看鹅，还是在看屏幕上的像素点？', '鹅思故鹅在。',
  // 傲娇款
  '哼，别以为鹅不知道你在摸鱼。', '你再点一下试试？信不信鹅...嘎给你看！', '鹅的羽毛很贵的，不许乱摸。',
  // 暖心款
  '今天也要加油哦！', '累了就歇歇吧，鹅陪着你。', '你的光标，像星星一样闪亮。',
  // 神秘款
  '嘘...鹅看到了一个秘密。', '你知道...屏幕背后是什么吗？',
  // 打破次元壁
  '鹅是谁？鹅在哪？哦，在你的屏幕上。', '帮鹅点一下那个“开始”菜单，谢谢。',
];
const ACTIVE_TOOLTIPS = [
  // 经典款
  '芜湖, 起飞!', '走咯, 走咯!', '看鹅M字抖动!', '要去哪儿呢...', '别挡道!', '嘎——!', '冲鸭!', '根本停不下来~',
  // 文学鹅
  '鹅在追逐屏幕上流动的光。', '每一次迁徙，都是为了新的风景。', '步履不停，心向远方。',
  // 哲学鹅
  '前进是唯一的方向，直到遇到边界。', '速度与激情，只是为了证明鹅的存在。', '从一个像素到另一个像素的远征。',
  // 傲娇款
  '鹅走鹅的路，你最好别挡道！', '才不是为了你才走来走去的呢！', '看鹅光速飘移！你学不会的。',
  // 无厘头
  '一只鹅的使命是什么？大概是...巡视你的桌面吧。', '前面的图标，麻烦让一让！', '嘎。（这句话有1024种含义）',
  // 打破次元壁
  '去看看你的CPU现在多少度了？', '这屏幕的刷新率还挺高。', '让鹅看看你写的什么好东西...'
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
  const [bubbleText, setBubbleText] = useState('');
  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // --- Bubble Text Manager ---
  const showBubble = (text: string, duration: number = 2500) => {
    if (bubbleTimeoutRef.current) {
      clearTimeout(bubbleTimeoutRef.current);
    }
    setBubbleText(text);
    bubbleTimeoutRef.current = setTimeout(() => {
      setBubbleText('');
      bubbleTimeoutRef.current = null;
    }, duration);
  };

  // --- Event Handlers ---
  const handleClick = () => {
    if (state === 'IDLE') {
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
        showBubble(IDLE_TOOLTIPS[Math.floor(Math.random() * IDLE_TOOLTIPS.length)]);
      };

      if (rand < 0.2) {
        const flyState: GooseState = direction === 'right' ? 'FLY_RIGHT' : 'FLY_LEFT';
        setState(flyState);
        showBubble(ACTIVE_TOOLTIPS[Math.floor(Math.random() * ACTIVE_TOOLTIPS.length)]);
        setTimeout(() => returnToIdle(true), 6000);
      } else {
        const walkState: GooseState = direction === 'right' ? 'WALK_RIGHT' : 'WALK_LEFT';
        setState(walkState);
        showBubble(ACTIVE_TOOLTIPS[Math.floor(Math.random() * ACTIVE_TOOLTIPS.length)]);
        setTimeout(() => returnToIdle(false), 5000);
      }
    } else {
      // Logic to INTERACT while active
      const randomIndex = Math.floor(Math.random() * ACTIVE_TOOLTIPS.length);
      showBubble(ACTIVE_TOOLTIPS[randomIndex]);
    }
  };

  const handleMouseEnter = () => {
    if (state === 'IDLE') {
      const randomIndex = Math.floor(Math.random() * IDLE_TOOLTIPS.length);
      showBubble(IDLE_TOOLTIPS[randomIndex], 1500);
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

  const gooseContainerStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${position.top}px`,
    left: `${position.left}px`,
    width: `${FRAME_WIDTH}px`,
    height: `${FRAME_HEIGHT}px`,
    zIndex: 1000,
    userSelect: 'none',
    cursor: 'pointer',
  };

  const gooseSpriteStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundImage: `url(${SPRITE_SRC})`,
    backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
    imageRendering: 'pixelated',
  };

  const bubbleStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '95%',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 12px',
    background: 'white',
    borderRadius: '10px',
    border: '1px solid #ccc',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    opacity: bubbleText ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
    pointerEvents: 'none', // Important so it doesn't block clicks on the goose
  };

  return (
    <div style={gooseContainerStyle} onClick={handleClick} onMouseEnter={handleMouseEnter}>
      {bubbleText && <div style={bubbleStyle}>{bubbleText}</div>}
      <div style={gooseSpriteStyle}></div>
    </div>
  );
};

export default Goose;
