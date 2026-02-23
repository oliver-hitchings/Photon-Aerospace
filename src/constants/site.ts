export const CONTACT_EMAIL = 'Oliver.Hitchings@photonaerospace.co.uk';

export const CONTACT_SUBJECT = 'Photon Aerospace Investor Inquiry';

export const CONTACT_BODY = `Hello Oliver,\n\nI am interested in learning more about Photon Aerospace and your seed funding round.\n\nPlease send me your business plan, technical reports, and investor deck.\n\nBest regards,`;

export const MAILTO_LINK = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}&body=${encodeURIComponent(CONTACT_BODY)}`;

export const ASSETS = {
  sequenceVideo: '/assets/sequence.mp4',
  desertMap: '/assets/desert-map-1.jpg',
  droneFeed: '/assets/drone-image-1.jpg',
  joinOurMission: '/assets/JoinOurMission.png',
  featurePerpetualSolarFlight: '/assets/Perpetual Solar Flight.png',
  featureModularPayload: '/assets/Modular Payload System.png',
  featureAiAutonomy: '/assets/AI-Driven Autonomy.png'
} as const;
