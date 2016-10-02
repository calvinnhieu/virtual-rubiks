var canvas;

var config = {
    angle: 0.01,
    tiltAngle: 0.1,
    draw: draw,
    updatePosition: updatePosition,
    updateState: updateState
};

function draw(confetti) {
    canvas.context.beginPath();
    canvas.context.lineWidth = confetti.r / 2;
    canvas.context.strokeStyle = confetti.color;
    canvas.context.moveTo(confetti.x + confetti.tilt + (confetti.r / 4), confetti.y);
    canvas.context.lineTo(confetti.x + confetti.tilt, confetti.y + confetti.tilt + (confetti.r / 4));
    canvas.context.stroke();
}

function updatePosition(confetti, idx) {
    confetti.tiltAngle += confetti.tiltAngleIncrement;
    confetti.y += (Math.cos(config.angle + confetti.d) + 1 + confetti.r / 2) / 2;
    confetti.x += Math.sin(config.angle);
    confetti.tilt = 15 * Math.sin(confetti.tiltAngle - idx / 3);

    if (confetti.isFlakeExiting(canvas)) {
        if (idx % 5 > 0 || idx % 2 === 0) {
            confetti.x = Confetti.randomFrom(0, canvas.width);
            confetti.y = -10;
            confetti.tilt = Confetti.randomFrom(-10, 0);

        } else {
            if (Math.sin(config.angle) > 0) {
                confetti.x = -5;
                confetti.y = Confetti.randomFrom(0, canvas.height);
                confetti.tilt = Confetti.randomFrom(-10, 0);
            } else {
                confetti.x = canvas.width + 5;
                confetti.y = Confetti.randomFrom(0, canvas.height);
                confetti.tilt = Confetti.randomFrom(-10, 0);
            }
        }
    }
}

function updateState() {
    this.angle += 0.01;
    this.tiltAngle += 0.1;
}
