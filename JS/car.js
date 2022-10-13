class Car {
    constructor(x, y, width, height, controlType, maxSpeed=3, color="blue") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 0;
        this.acceleration = 0.2;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        this.angle = 0;
        this.damaged = false;
        this.useBrain = controlType=="AI";

        // if the car isn't a traffic dummy, give it a sensor
        if (controlType != "DUMMY"){
            this.sensor=new Sensor(this);
            // one hidden (input) layer w 6 neurons and 4 outputs (left, right, up, down)
            this.brain =new NeuralNetwork(
                [this.sensor.rayCount, 6, 4]
            );
        }

        // controlType is either KEYS or DUMMY
        this.controls=new Controls(controlType);

        this.img = new Image();
        this.img.src = "car.png";

        this.mask = document.createElement("canvas");
        this.mask.width = width;
        this.mask.height = height;

        const maskCtx = this.mask.getContext("2d");
        // use arrow notation to still have access to "this"
        this.img.onload=()=>{
            maskCtx.fillStyle = color;
            maskCtx.rect(0,0,this.width,this.height);
            maskCtx.fill();

            // keeps blue color only when it overlaps w/ visible pix in image
            maskCtx.globalCompositeOperation = "destination-atop";
            maskCtx.drawImage(this.img,0,0,this.width,this.height);
        }
    }

    update(roadBorders, traffic) {
        // if car is not damaged, update
        if (!this.damaged){
            this.#move();
            this.polygon = this.#createPolygon();
            this.damaged = this.#assessDamage(roadBorders, traffic);
        }
        // if the sensor exists, update it
        if (this.sensor){
            this.sensor.update(roadBorders, traffic);
            // if reading is null (not sensing anything), make it 0
            // otherwise return 1 - the sensor offset
            // want neurons to get low inputs if reading is far away, high if close
            const offsets = this.sensor.readings.map(
                s=>s==null?0:1-s.offset 
            );
            const outputs = NeuralNetwork.feedForward(offsets, this.brain);
            
            if (this.useBrain){
                this.controls.forward = outputs[0];
                this.controls.left = outputs[1];
                this.controls.right = outputs[2];
                this.controls.reverse = outputs[3];
            }
        }
    }

    #assessDamage(roadBorders, traffic) {
        // check if car intersects with borders
        for (let i=0; i<roadBorders.length; i++) {
            if (polysIntersect(this.polygon, roadBorders[i])){
                return true;
            }
        }
        // check if car intersects/crashes with traffic
        for (let i=0; i<traffic.length; i++) {
            if (polysIntersect(this.polygon, traffic[i].polygon)){
                return true;
            }
        }
        return false;
    }

    #createPolygon() {
        const points = [];  // one point per corner of the car
        const rad = Math.hypot(this.width, this.height)/2;   // from center to corner
        const alpha = Math.atan2(this.width, this.height);  // angle from center (line down middle) to radius
        
        // top right point (1:13:00)
        points.push({
            x:this.x-Math.sin(this.angle-alpha)*rad,
            y:this.y-Math.cos(this.angle-alpha)*rad
        });
        points.push({
            x:this.x-Math.sin(this.angle+alpha)*rad,
            y:this.y-Math.cos(this.angle+alpha)*rad
        });
        points.push({
            x:this.x-Math.sin(Math.PI+this.angle-alpha)*rad,
            y:this.y-Math.cos(Math.PI+this.angle-alpha)*rad
        });
        points.push({
            x:this.x-Math.sin(Math.PI+this.angle+alpha)*rad,
            y:this.y-Math.cos(Math.PI+this.angle+alpha)*rad
        });

        return points;
    }

    #move() {
        // increase speed if forward is pressed
        if (this.controls.forward){
            this.speed += this.acceleration;
        }
        // decrease speed if reverse is pressed
        if (this.controls.reverse){
            this.speed -= this.acceleration;
        }
        // limit speed to maxSpeed
        if (this.speed > this.maxSpeed){
            this.speed = this.maxSpeed;
        }
        // limit speed for reverse
        if (this.speed < -this.maxSpeed/2){
            this.speed = -this.maxSpeed/2;
        }
        // implement friction when moving forward
        if (this.speed > 0){
            this.speed -= this.friction;
        }
        // implement friction when moving backwards
        if (this.speed < 0){
            this.speed += this.friction;
        }
        // eliminate friction moving a stationary car
        if (Math.abs(this.speed) < this.friction){
            this.speed = 0;
        }
        // make car go correct direction in reverse
        if (this.speed != 0){
            const flip = this.speed>0?1:-1; // 1 or -1 depending on the speed
            if (this.controls.left){
                this.angle += 0.03*flip;
            }
            if (this.controls.right){
                this.angle -= 0.03*flip;
            }
        }

        // from the unit circle
        this.x -= Math.sin(this.angle)*this.speed;
        this.y -= Math.cos(this.angle)*this.speed;
    }

    draw(ctx, drawSensor=false) {
        if (this.sensor && drawSensor) {
            this.sensor.draw(ctx);
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);
        // don't use mask if damaged (car will turn gray)
        if (!this.damaged){
            ctx.drawImage(this.mask,
                -this.width/2,
                -this.height/2,
                this.width,
                this.height);
            // puts car details on top of the blue canvas
            ctx.globalCompositeOperation = "multiply";
        }
  

        ctx.drawImage(this.img,
            -this.width/2,
            -this.height/2,
            this.width,
            this.height);

        ctx.restore();
    }
}