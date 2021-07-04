

export const registerSettings = function () {
    game.settings.register("tension-pool", "poscName", {
        name: "Name of the dice pool?",
        scope: "world",
        config: true,
        default: "Tension Pool",
        type: String
    });

    game.settings.register("tension-pool", "TensionFilled", {
        name: "Image for additions to Tension Pool",
		hint: "These will represent the Tension Pool in each filled slot in the chat footer.",
        scope: "world",
        config: true,
        default: "modules/tension-pool/images/Tension_Filled.webp",
        type: String,
		filePicker: true
    });
	
	game.settings.register("tension-pool", "TensionEmpty", {
        name: "Image for empty parts of the Tension Pool",
		hint: "These will represent the Tension Pool in each unfilled slot in the chat footer.",
        scope: "world",
        config: true,
        default: "modules/tension-pool/images/Tension_Empty.webp",
        type: String,
		filePicker: true
    });
	
	game.settings.register("tension-pool", "diceinpool", {
        name: "dice in pool",
        scope: "world",
        config: false,
        default: 0,
        type: Number
    });

    game.settings.register("tension-pool", "maxdiceinpool", {
        name: "Max Dice in Pool",
        scope: "world",
        config: true,
        default: 6,
        type: Number
    });

    game.settings.register("tension-pool", "emptythepool", {
        name: "Empty the pool on non-full roll?",
        hint:"Should the pool be emptied if it is rolled before Max Dice in Pool is reached.",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("tension-pool", "dropdie", {
        name: "Drop a die on add?",
        hint:"Roll a die to demostrate it being added to the pool. (Result is ignored)",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });


    game.settings.register("tension-pool", "dicesize", {
        name: "Dice Size:",
        hint:"d6 (!) will lock dice so nice to the uses of the tension pool dice set. Fate Die will always output the sum.",
        scope: "world",
        config: true,
        default: "dt6",
        type: String,
        choices: {
            d4: "d4",
            d6: "d6 (normal)",
            dt6: "d6 (!)",
            d8: "d8",
            d10: "d10",
            d12: "d12",
            d20: "d20",
            df: "Fate",
        },
        onChange: () => {
            location.reload();
        }
    });



    game.settings.register("tension-pool", "outputto", {
        name: "Where to announce updates:",
        hint:"Pool Rolls outcomes are always output to chat.",
        scope: "world",
        config: true,
        default: "notfications",
        type: String,
        choices: {
            both: "both",
            notfications: "notfications",
            chatlog: "chatlog",
        },
    });



    game.settings.register("tension-pool", "SafeMessage", {
        name: "Message when no complication occurs:",
        scope: "world",
        config: true,
        default: "You are safe for now.",
        type: String,
    });

    game.settings.register("tension-pool", "DangerMessage", {
        name: "Message when a complication does occurs:",
        scope: "world",
        config: true,
        default: "<strong style='color:red'>Complication!</strong>",
        type: String,
    });

    game.settings.register("tension-pool", "outputsum", {
        name: "Output sum?",
        hint:"Replace calulation of the complication with a simple sum of the dice values.",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });


};
