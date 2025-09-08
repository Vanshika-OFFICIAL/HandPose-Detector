let video;
let handpose;
let predictions = [];
let gestureLabel = "Detecting...";

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  handpose = ml5.handpose(video, modelReady);
  handpose.on("predict", results => {
    predictions = results;
  });

  textAlign(LEFT, BOTTOM);
  textSize(32);
  fill(50);
}

function modelReady() {
  console.log("Handpose model loaded!");
}

function draw() {
  background(240);
  image(video, 0, 0, width, height);
  drawHands();

  if (predictions.length > 0) {
    const hand = predictions[0];
    if (
      hand.handInViewConfidence > 0.75 &&
      hand.landmarks &&
      hand.landmarks.length >= 10
    ) {
      gestureLabel = detectGesture(hand);
    } else {
      gestureLabel = "Hand not clear";
    }
  } else {
    gestureLabel = "No hand detected";
  }

  drawLabel(gestureLabel);
}

function drawLabel(label) {
  fill(0);
  noStroke();
  rect(0, height - 40, width, 40);
  fill(255);
  text(label, 10, height - 10);
}

function drawHands() {
  for (let hand of predictions) {
    for (let [x, y] of hand.landmarks) {
      fill(0, 255, 0);
      noStroke();
      ellipse(x, y, 8, 8);
    }

    for (let finger of Object.keys(hand.annotations)) {
      const points = hand.annotations[finger];
      for (let i = 0; i < points.length - 1; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[i + 1];
        stroke(0, 255, 0);
        strokeWeight(2);
        line(x1, y1, x2, y2);
      }
    }
  }
}

function detectGesture(hand) {
  const palm = hand.landmarks?.[0];
  const middleKnuckle = hand.landmarks?.[9];

  if (!palm || !middleKnuckle) return "Hand not clear";

  const baseDistance = dist(palm[0], palm[1], middleKnuckle[0], middleKnuckle[1]);

  const tips = Object.keys(hand.annotations).map(f => hand.annotations[f]?.[3]).filter(Boolean);
  let extended = 0;

  for (let tip of tips) {
    const d = dist(tip[0], tip[1], palm[0], palm[1]);
    if (d > baseDistance * 0.8) extended++;
  }

  if (extended === 0) return "Fist ✊";
  if (extended >= 4) return "Open Palm 🖐️";

  const indexTip = hand.annotations.indexFinger?.[3];
  const middleTip = hand.annotations.middleFinger?.[3];
  const ringTip = hand.annotations.ringFinger?.[3];
  const pinkyTip = hand.annotations.pinky?.[3];

  if (!indexTip || !middleTip || !ringTip || !pinkyTip) return "Hand not clear";

  const dIndex = dist(indexTip[0], indexTip[1], palm[0], palm[1]);
  const dMiddle = dist(middleTip[0], middleTip[1], palm[0], palm[1]);
  const dRing = dist(ringTip[0], ringTip[1], palm[0], palm[1]);
  const dPinky = dist(pinkyTip[0], pinkyTip[1], palm[0], palm[1]);

  if (dIndex > baseDistance * 0.8 && dMiddle > baseDistance * 0.8 && dRing < baseDistance * 0.5 && dPinky < baseDistance * 0.5) {
    return "Peace ✌️";
  }

  return "Unknown Gesture";
}