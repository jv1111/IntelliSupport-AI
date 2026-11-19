import type { AutoReply, AutoReplyGroup, BotProduct } from "./types";

export const initialBotProducts: BotProduct[] = [
  {
    id: "PROD-101",
    name: "Smart Wi-Fi Router X200",
    model: "WR-X200-PRO",
    description:
      "Dual-band Gigabit Smart Router featuring mesh coverage up to 2500 sq ft and AI-powered bandwidth optimization.",
    visual: "router",
  },
  {
    id: "PROD-102",
    name: "Outdoor Security Cam 4K",
    model: "CAM-4K-OUTDOOR",
    description:
      "Weatherproof 4K solar-assisted security camera with color night vision and two-way audio setup.",
    visual: "camera",
  },
  {
    id: "PROD-103",
    name: "Smart Doorbell Pro",
    model: "DOOR-BELL-PRO",
    description:
      "1080p HD Video Doorbell with customizable motion zones and quick chime pairing.",
    visual: "doorbell",
  },
];

export const initialAutoReplyGroups: AutoReplyGroup[] = [
  {
    id: "G-1",
    productId: "PROD-101",
    name: "Setup & Troubleshooting",
  },
  {
    id: "G-2",
    productId: "PROD-102",
    name: "Product Features",
  },
];

export const initialAutoReplies: AutoReply[] = [
  {
    id: "AR-3",
    groupId: "G-1",
    productId: "PROD-101",
    question: "How do I reset the router?",
    answer:
      "Hold the reset button for 10 seconds until the LED blinks white, then wait 2 minutes for it to restart.",
    active: true,
  },
  {
    id: "AR-4",
    groupId: "G-1",
    productId: "PROD-101",
    question: "What is the Wi-Fi coverage range?",
    answer: "The X200 covers up to 2500 sq ft with mesh coverage.",
    active: false,
  },
  {
    id: "AR-3a",
    parentId: "AR-3",
    productId: "PROD-101",
    question: "The LED light is blinking.",
    answer:
      "A blinking white LED means the reset is in progress. Please wait 2 minutes without unplugging the router.",
    active: true,
  },
  {
    id: "AR-3a1",
    parentId: "AR-3a",
    productId: "PROD-101",
    question: "It keeps blinking after 2 minutes.",
    answer:
      "Unplug the router for 30 seconds, plug it back in, and wait for a solid white LED.",
    active: true,
  },
  {
    id: "AR-3b",
    parentId: "AR-3",
    productId: "PROD-101",
    question: "The LED light is not blinking.",
    answer:
      "Make sure the power adapter is firmly connected, then hold the reset button again for 10 seconds.",
    active: true,
  },
  {
    id: "AR-5",
    groupId: "G-2",
    productId: "PROD-102",
    question: "Is the camera waterproof?",
    answer: "Yes, it is IP66 weatherproof and safe for outdoor use.",
    active: true,
  },
];
