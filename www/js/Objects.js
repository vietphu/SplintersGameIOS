
// cache pi for performance
var PI = Math.PI; 

// Game objects are anything displayed on the screen to a user. Can be
// a player, NPC, goal, wall, item, etc
var GameObject = Class.create({

	initialize: function(spec){

		// allows objects to be called without providing an spec object
		spec = spec || {};

		// neutral, player, enemy, item
		this.name = "GameObject";

		// positions to tell how to render
		this.x = spec.x || 0;
		this.y = spec.y || 0;
		this.angle = spec.angle || PI/2;	// defines an angle in radians

		// Defines the inner circle to be used for collision detection with
		// other game objects
		this.hitRadius = spec.hitRadius || 0;

		// movement
		this.speed = spec.speed || 0;
		this.acceleration = spec.acceleration || 0;
		this.deceleration = spec.deceleration || 0;
		this.delay = spec.delay || 0;

		// path to the object's image sprite
		this.spritePath = spec.spritePath;

	},


	// a method to draw the object with their x-position and y-position
	draw: function() {

	},

	// return object's x- and y-coordinates as a vector-like object
	vector: function() {
		return {x: this.x, y: this.y};
	},

	// shift the object's position
	shift: function(x, y) {
		this.x += x;
		this.y += y;
	}

});

// Decorations are non-interactive objects such as backgrounds
var Decoration = Class.create(GameObject, {

	initialize: function($super, spec) {
		$super(spec);

		spec = spec || {};

		this.name="Decoration";

	}

});


// The background of the game
var Background = Class.create(Decoration, {

	initialize: function($super, spec) {
		$super(spec);

		spec = spec || {};

		this.name="Background";

		this.image = new Image();

		this.image.src = this.spritePath || "";
		this.customParallaxModifier = spec.customParallaxModifier || 1;
	}

});


// Characters are any interactive game objects (such as the player,
// NPC's, walls, items, goals, etc.)
var Character = Class.create(GameObject, {
	
	initialize: function($super, spec) {
		$super(spec);

		spec = spec || {};

		this.name="Character";

	},

	draw: function() {

	}
});



// The player's main character
var Hero = Class.create(Character, {


	initialize: function($super, spec) {
		$super(spec);

		spec = spec || {};
		this.name = "Hero";

		this.image = new Image();
		this.image.src = this.spritePath || "";
	},


	draw: function() {
		
	}
});



// Urchins are the primary enemy. They have multiple arms which extend
// outward in an attempt to strike the player or block their path
var Urchin = Class.create(Character, {

	initialize: function($super, spec) {
		$super(spec);

		spec = spec || {};
		this.name = "Urchin";

		this.hitRadius = 3;

		// 0 = no rotation, (+) = clockwise, (-) = counterclockwise
		this.rotateSpeed = spec.rotateSpeed || 0;
        this.growSpeed = spec.growSpeed || 0;

		// determines whether the urchin grows, rotates, etc. when instantiated
		this.active = spec.active==undefined ? true : spec.active;
		// the distance from the player at which the special behavior activates
		this.activeRadius = spec.activeRadius || 0;

		this.exploded = false;
		this.explodeToLength = spec.explodeToLength || null;
		this.explodeByLength = spec.explodeByLength || null;

		this.arms = spec.arms || [];	// stores the actual arms
		this.initialArmLengths = [];

		// initialize arms, setting body and x- and y-coordinates
		this.initArms();
	},

	// 
	initArms: function() {
		
		// set the body, x- and y-coords of each arm
		for(var i in this.arms){
			var arm = this.arms[i];
			arm.body = this;
			arm.x = this.x;
			arm.y = this.y;

			this.initialArmLengths.push(this.arms[i].length);
		}
	},

	// activate whatever abilities urchin has
	activate: function() {
		this.explode();
		this.active = false;
	},

	explode: function() {
		if(!this.exploded){
			if(this.explodeToLength){
				this.explodeTo(this.explodeToLength);
			} else if (this.explodeByLength) {
				this.explodeBy(this.explodeByLength);
				this.explodeByLength = 0; // have to reset so it does not continue to expand
			} else {
				for(var i=0; i<this.arms.length; i++){
					var arm = this.arms[i];
					arm.length = arm.explodeLength;
				}
			}
			this.exploded = true;
		}
	}, 

	explodeTo: function(length) {
		for(var i=0; i<this.arms.length; i++){
			var arm = this.arms[i];
			arm.length = length;
		}
	}, 

	// arms increase by amount parameter
	explodeBy: function(length) {
		for(var i=0; i<this.arms.length; i++){
			var arm = this.arms[i];
			arm.length += length;
		}
	},

	getArmCount: function() {
		return this.arms.length;
	},

	// groups everything an urchin will do (e.g. grow arms, rotate, etc.)
	step: function() {

		if(this.active){
				
			

			// rotation, rotate all arms and body
			if(this.rotateSpeed != 0){

				// increase all arms' angles by the rotate speed
				for(var i=0; i<this.arms.length; i++){
					this.arms[i].angle += this.rotateSpeed;
				}

				this.angle += this.rotateSpeed;
			}

			// moving, move all arms and body
			if(this.speed > 0){

			}

			// growing arms
            if (this.growSpeed != 0) {
                for (var i=0; i<this.arms.length; i++) {
                	this.arms[i].grow(this.growSpeed);
                }          
            } else {
				for(var i=0; i<this.arms.length; i++){
					this.arms[i].grow();
				}
			}
			

		}

	}
});


// 
var Arm = Class.create(Character, {
	
	initialize: function($super, spec) {
		$super(spec);

		spec = spec || {};
		this.name = "Arm";

		this.body;	// the arms's parent body
		this.length = spec.length || 0;
		this.growSpeed = spec.growSpeed || 0;
		this.explodeLength = spec.explodeLength || 0;
		this.implodeLength = spec.implodeLength || 0;

	},

	// the point from which the arm expands outward
	origin: function() {
		return {x: this.body.x, y: this.body.y};
	},

	// the end point of the arm (away from the body)
	end: function() {
		var endX = this.body.x + this.length * Math.cos(this.angle);
		var endY = this.body.y + this.length * Math.sin(this.angle);
		return {x: endX, y: endY};
	},

	// increase the arm's length by the amount parameter, if provided,
	// default to the default grow speed
	grow: function(amount) {
		if(amount){
			this.length += amount;
		} else {
			this.length += this.growSpeed;
		}
	}
});

var Item = Class.create(Character, {

	initialize: function($super, spec) {
		$super(spec);

		spec = spec || {};
		this.name = "Item";
	},

	// execute when player gets item
	claimed: function() {

	}

});

