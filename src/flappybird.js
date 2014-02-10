var Const = {
	BIRD_RADIUS : 28,
	BIRD_JUMP_SPEED : 8,
	OBST_WIDTH : 85,
	OBST_MAX_HEIGHT : 220,
	OBST_MIN_HEIGHT : 60,
	OBST_COUNT : 100,
	OBST_START_X : 300,
	OBST_MARGIN : 300,
	OBST_HEAD_HEIGHT : 32,
	SCREEN_HEIGHT : 640,
	SCREEN_WIDTH : 480,
	PASS_HEIGHT : 200,
	X_VOL : 4,
	G : 0.6 
};
	
var XHH = {	
	Point : function(x,y) {
		this.x = x ? x : 0;
		this.y = y ? y : 0;
	},
	
	Bird : function() {
		this.x = 100;
		this.y = 400;
		this.vx = Const.X_VOL;
		this.vy = 0;
		this.r = Const.BIRD_RADIUS;
		this.isDead = false;
	},
	
	Obstacle : function(x, height, dir) {
		this.x = x;
		this.dir = dir;
		this.y = this.dir == 1 ? 0 : Const.SCREEN_HEIGHT;
		this.width = Const.OBST_WIDTH;
		this.height = height;
		this.passed = false;
	},
	
	Game : function() {
	},
	
	Node : function(parent, jump, nextCenter) {
		this.frame = parent.frame + 1;
		this.r = Const.BIRD_RADIUS;
		this.parent = parent;
		
		this.b = new XHH.Point(parent.b.x + Const.X_VOL, parent.b.y);
		
		this.jump = jump;
		this.valid = true;
		
		if(jump) // jump
			this.v = -Const.BIRD_JUMP_SPEED;
		else
			this.v = parent.v + Const.G;
			
		this.b.y += this.v;
		
		if(this.b.y < 0) this.b.v = 0;
		if(this.b.y - Const.BIRD_RADIUS >= Const.SCREEN_HEIGHT) this.valid = false;
	
		this.g = parent.h + this.b.dis(parent.b);
		this.h = nextCenter.dis(this.b) + (nextCenter.y - this.b.y)*(nextCenter.y - this.b.y);
		this.f = this.g + this.h;
	},
	
	OP : function(frame, jump) {
		this.frame = frame;
		this.jump = jump;
	}
};

XHH.Point.prototype = {
	dis : function(point) {
		return Math.sqrt((this.x - point.x)*(this.x - point.x) + (this.y - point.y)*(this.y - point.y))
	}
};

XHH.Node.prototype = {
	toOP : function() {
		return new XHH.OP(this.frame, this.jump);
	}
};

XHH.Bird.prototype = {
	jump : function() {
		if(this.isDead) return;
		
		this.vy = -Const.BIRD_JUMP_SPEED; 
	},
	
	update : function() {
		
		if(!this.isDead)
			this.x += this.vx;
		
		this.y += this.vy;
		
		if(this.y < 0) {
			this.y = 0;
			this.vy = 0;
		}
		
		if(this.y > Const.SCREEN_HEIGHT - this.r) {
			this.y = Const.SCREEN_HEIGHT - this.r;
			return;
		}
		this.vy += Const.G;
	},
	
	die : function() {
		this.isDead = true;
		this.vy = 0;
	}
};

XHH.Obstacle.prototype = {
	/**
	 * 
 	 * @param {XHH.Bird} bird
	 */
	hit : function(bird) {
		var left = this.x - this.width / 2;
		var right = this.x + this.width / 2;
		var bottom = this.dir == 1 ? 0 : Const.SCREEN_HEIGHT - this.height;
		var top = bottom + this.height;
		
		
		if(this.dir == 1) {
			if(bird.x >= left - Const.BIRD_RADIUS && bird.x <= right + Const.BIRD_RADIUS && bird.y <= top) return true;	
			if(bird.x >= left && bird.x < right && bird.y - Const.BIRD_RADIUS <= top) return true;
		}else{
			if(bird.x >= left - Const.BIRD_RADIUS && bird.x <= right + Const.BIRD_RADIUS && bird.y >= bottom) return true;
			if(bird.x >= left && bird.x <= right && bird.y + Const.BIRD_RADIUS >= bottom) return true;
		}
		
		var bc = new XHH.Point(bird.x, bird.y);
		var lc = new XHH.Point(left, this.dir == 1 ? top : bottom);
		var rc = new XHH.Point(right, this.dir == 1 ? top : bottom);
		
		if(lc.dis(bc) <= Const.BIRD_RADIUS) return true;
		if(rc.dis(bc) <= Const.BIRD_RADIUS) return true;
		
		return false;
	}
}

XHH.Game.prototype = {
	
	
	random : function() {
		var x = Math.abs(Math.sin(this.seed++)) * 10000;
    	return x - Math.floor(x);
	},
	
	createObstacle : function() {
		for(var i=0;i<Const.OBST_COUNT;i++) {
			var ht_up = Math.floor(this.random() * (Const.OBST_MAX_HEIGHT - Const.OBST_MIN_HEIGHT)) + Const.OBST_MIN_HEIGHT;
			var ht_dw = Const.SCREEN_HEIGHT - Const.PASS_HEIGHT - ht_up;
			var x = Const.OBST_START_X + i*Const.OBST_MARGIN;
			var obst_up = new XHH.Obstacle(x, ht_up, 1);
			var obst_dw = new XHH.Obstacle(x, ht_dw, -1);
			
			this.obsts.push(obst_up);
			this.obsts.push(obst_dw);
		}
	},
	
	gameOver : function(){
		this.isGameOver = true;
		this.gameOverTime = new Date().getTime();
		this.bird.die();
		this.saveRecord();
	},
	
	checkGameOver : function() {
		
		// hit the floor
		if(this.bird.y >= Const.SCREEN_HEIGHT - this.bird.r) return true;
		
		// at most 3*2 obstacles in the view
		var passed = false;
		for(var i=0;i<3*2;i++)
		{
			var obst = this.obsts[this.obstIndex + i];
			
			if(obst.hit(this.bird))	{
				console.log('obst ' + (this.obstIndex + i) + ' hitted the bird!');
				return true;
			}
			
			if(this.bird.x > obst.x && !obst.passed) {
				obst.passed = passed = true;
			}
		}
		if(passed) {
			this.score++;
			if(this.score > this.record) this.record = this.score;
		}
		
		return false;
	},
	
	hitTest : function(pt) {
		for(var i=0;i<6*2;i++)
		{
			var obst = this.obsts[this.obstIndex + i];
			
			if(obst.hit(pt)) return true;
		}
		return false;
	},
	
	update : function() {
		
		if(!this.isGameStarted) return;
		
		this.bird.update();
		
		if(this.isGameOver) return;
		
		this.left += this.vx;
		
		if (this.checkGameOver())
			this.gameOver();
		
		var obst_lm = this.obsts[this.obstIndex];
		// left most obstacle was out of view
		if(obst_lm.x + obst_lm.width/2 < this.left)
			this.obstIndex+=2;
		
		if(this.isCOM) {
			if(this.ops.length == 0 && this.lastFound) {
				this.lastFound = this.AStar();
			}
			if(this.ops.length != 0) {
				while(this.ops[0].frame < this.frame) this.ops.shift();
				if(this.ops[0].frame == this.frame) {
					this.ops.shift();
					this.bird.jump();
				}
				
			}
		}	
		
		this.frame++;
	},
	
	drawBird : function() {
		ctx.beginPath();
		ctx.strokeStyle = "#FFFFFF";
		ctx.fillStyle = "#FF0000";
		ctx.arc(this.bird.x - this.left, this.bird.y, this.bird.r, 0, 2*Math.PI);
		ctx.fill();
		//ctx.endPath();
	},
	
	drawTraj : function() {
		
		for(var i=0;i<this.traj.length;i++)
		{
			var p = this.traj[i].b;
			ctx.beginPath();
			ctx.fillStyle = "#0000FF";
			ctx.arc(p.x - this.left, p.y, this.bird.r, 0, 2*Math.PI);
			ctx.fill();
		}
		
	},
	
	drawObst : function(obst) {
		var x = obst.x - this.left - obst.width/2;
		var y = obst.dir == 1 ? 0 : Const.SCREEN_HEIGHT - obst.height;
		var x_s = x + obst.width/3;
		var w_l = obst.width/3;
		var w_r = obst.width/3*2;

      	var grd=this.ctx.createLinearGradient(x,y,x_s,y);
		grd.addColorStop(0,"#75BA6E");
		grd.addColorStop(1,"#DDF0D8");
		this.ctx.fillStyle = grd;
		
		this.ctx.fillRect(x, y, w_l, obst.height);
		
		var grd=this.ctx.createLinearGradient(x_s,y,x + obst.width, y);
		grd.addColorStop(0,"#DDF0D8");
		grd.addColorStop(1,"#318C27");
		
		this.ctx.fillStyle = grd;
		this.ctx.fillRect(x_s, y, w_r, obst.height);
		
		this.ctx.beginPath();
		this.ctx.strokeStyle = "291B09";
		this.ctx.lineWidth = 2;
		this.ctx.rect(x,y,obst.width,obst.height);
		this.ctx.stroke();
		
		this.ctx.beginPath();
		this.ctx.strokeStyle = "291B09";
		this.ctx.lineWidth = 3;
		this.ctx.rect(x,obst.dir == 1 ? y + obst.height - Const.OBST_HEAD_HEIGHT : y, obst.width, Const.OBST_HEAD_HEIGHT);
		this.ctx.stroke();
	},
	
	drawObsts : function() {
		// at most 3*2 obstacles in the view
		for(var i=0;i<3*2;i++)
		{
			var obst = this.obsts[this.obstIndex + i];	
			this.drawObst(obst);	
		}
	},
	
	render : function() {
		this.update();
		this.ctx.clearRect(0,0,Const.SCREEN_WIDTH,Const.SCREEN_HEIGHT);
		this.drawObsts();
		this.drawTraj();
		this.drawBird();
	},
	
	getRecord : function() {
		var record = localStorage.getItem("record");
		return record ? record : 0;
	},
	
	saveRecord : function() {
		localStorage.setItem("record", this.record);
	},
	
	AStar : function() {
		
		var bx = new XHH.Point(this.bird.x, this.bird.y);
		
		var it = null, ib = null;
		for(var i=0;i<3*2;i++)
		{
			var obst = this.obsts[this.obstIndex + i];	
			if(obst.x > bx.x && obst.dir == 1 && it == null) it = obst;
			if(obst.x > bx.x && obst.dir == -1 && ib == null) ib = obst;
		}
		
		var center = new XHH.Point(it.x + it.width/2 + this.bird.r, it.height + Const.PASS_HEIGHT/2 + this.bird.r);
		
		console.log("A* current = " + bx.x + "," + bx.y + " target = " + center.x + "," + center.y);
		
		var q = new PriorityQueue({ comparator: function(a, b) { return a.f - b.f; }});
		
		var parent = {
			parent : null,
			b : bx,
			g : 0,
			h : bx.dis(center),
			v : this.bird.vy,
			frame : this.frame,
			jump : 0,
			toOP : function() { return new XHH.OP(this.frame, this.jump)}
		};
		
		var n0 = new XHH.Node(parent, false, center);
		var n1 = new XHH.Node(parent, true, center);
		
		var startTime = new Date().getTime();
		
		if(n0.valid && !this.hitTest(n0.b)) q.queue(n0);
		if(n1.valid && !this.hitTest(n1.b)) q.queue(n1);
		
		var created = q.length;
		var expended = 0;
		var found = false;
		
		while(q.length != 0) {
			var p = q.dequeue();
			expended ++;
			
			// goal reached
			if(p.b.dis(center) < 16) {
				console.log("found!");
				this.ops = [];
				this.traj = [];
				this.ops.push(p.toOP());
				this.traj.push(p);
				var pp = p.parent;
				while(pp) {
					if(pp.jump) this.ops.push(pp.toOP());
					this.traj.push(pp);
					pp = pp.parent;
				}
				
				this.ops.reverse();
				
				found = true;
				
				break;
			}
			
			n0 = new XHH.Node(p, false, center);
			n1 = new XHH.Node(p, true, center);
			
			if(n0.valid && !this.hitTest(n0.b)) { q.queue(n0); created++; }
			if(n1.valid && !this.hitTest(n1.b)) { q.queue(n1); created++; }
			
			if(expended > 4e5) break;
		}
		
		var endTime = new Date().getTime();
		
		console.log("found = " + found + " created = " + created + " expended = " + expended + " time = " + (endTime - startTime));
		
		return found;
	},
	
	start : function(isCOM) {
		
		this.isCOM = isCOM;
		this.isGameStarted = true;
		
		if(isCOM) {
			this.lastFound = this.AStar();
		}
	},
	
	init : function(seed, ctx) {
		this.seed = seed ? seed : 0;
		this.ctx = ctx;
		this.obstIndex = 0;
		this.vx = Const.X_VOL;
		this.obsts = [];
		this.left = 0;
		this.score = 0;
		this.isCOM = false;
		this.record = this.getRecord();
		this.obstIndex = 0;
		this.bird = new XHH.Bird();
		this.isGameOver = false;
		this.isGameStarted = false;
		this.createObstacle();
		this.ops = [];
		this.traj = [];
		this.lastFound = false;
		this.frame = 0;
	},
	
	onkeydown : function(e) {
		var keyCode = ('which' in event) ? event.which : event.keyCode;
		switch(keyCode){
			case 32:	// space
				if(this.isGameOver && (new Date().getTime() - this.gameOverTime > 500)){
					this.init(this.seed, this.ctx);
				} else if(!this.isGameStarted){
					this.start(false);
					this.bird.jump();
				} else {
					this.isCOM = false;
					this.bird.jump();
				}
				break;
			case 68:	// d
				this.start(true);
				break;
		}
	}
}
