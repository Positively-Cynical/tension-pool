import {registerSettings} from './settings.js';
import {TensionDie} from './die.js';
import {TensionLayer} from './tensionLayer.js';

'use strict';

function registerLayer() {
    console.log(TensionLayer);

    const layers = mergeObject(Canvas.layers, {
        TensionLayer: TensionLayer
    });
    Object.defineProperty(Canvas, 'layers', {
        get: function () {
            return layers
        }
    });

}

function messages(data) {
    if (data.datatype === "message") {
        ui.notifications.info(poscName + " | " + data.message);
    }

    if (data.datatype === "updatedisplay") {
        updatedisplay(data.message)
    }

}

function sendmessage(message){

    let outputto = game.settings.get("tension-pool",'outputto');
	let poscName = game.settings.get("tension-pool",'poscName');

    if (outputto === 'both' || outputto === 'notfications' ) {
        ui.notifications.info(poscName + " | " + message);
        game.socket.emit('module.tension-pool', {
            message: message,datatype:"message"
        });
    }

    if (outputto === 'both' || outputto === 'chatlog' ) {
        ChatMessage.create({content: message,speaker:ChatMessage.getSpeaker({alias: poscName})}, {});
    }
}

function sendmessageoveride(message){
	let poscName = game.settings.get("tension-pool",'poscName');
    ChatMessage.create({content: message,speaker:ChatMessage.getSpeaker({alias: poscName})}, {});

}

Hooks.once('init', async () => {
    console.log('tension-pool | Initializing tension-pool | Version: '+game.data.version[2]);
    registerSettings();
    registerLayer();
    CONFIG.Dice.terms["t"] = TensionDie;
});

Hooks.once('diceSoNiceReady', (dice3d) => {
    let systemlist = Object.keys(dice3d.DiceFactory.systems)

    var i;
    for (i = 0; i < systemlist.length; i++) {
      dice3d.addDicePreset({
          type:"dt6",
          labels:["modules/tension-pool/images/Dice_Tension.webp","","","","","",],
            bumpMaps:["modules/tension-pool/images/Dice_Tension_bump.webp","","","","","",],
          system: systemlist[i],
        });
    }


    dice3d.addColorset({
		name:'TPD',
		description:'Tension Pool Dice',
		category:'Tension Pool',
		foreground:'#ffff00',
		background:'#000000',
		outline:'black',
		edge:'#940202',
		texture:'none',
        font:"Bradley Hand",
	},"default");

});

Hooks.on("ready", () => {
    console.log('tension-pool | Ready');

    console.log("tension-pool | Listener")
    game.socket.on('module.tension-pool', (data) => messages(data));

    if(!game.settings.get("core", "noCanvas"))
        game.tension = new Tension();


});

async function updatedisplay(diceinpool){
	let TensionFilled = game.settings.get("tension-pool",'TensionFilled');
	let TensionEmpty = game.settings.get("tension-pool",'TensionEmpty');
    if (game.user.isGM) {
        game.socket.emit('module.tension-pool', {
            message: diceinpool, datatype: "updatedisplay"
        });
    }

    let display = document.getElementById("TensionDice-Pool");
    let pool = '<p id="TensionDice-Pool" style="flex-direction:row;flex-wrap:wrap;justify-content:flex-start;text-align:center;align-items:center;"></p>';
    let i;
    for (i = 0; i < diceinpool; i++) {
      pool+='<img class="noborder" src="'+ TensionFilled + '" alt="!" width="25" height="25">'
    }

    for (i = 0; i < game.settings.get("tension-pool",'maxdiceinpool')-diceinpool; i++) {
      pool+='<img class="noborder" src="'+ TensionEmpty + '" alt="X" width="25" height="25">'
    }


    display.innerHTML = pool;
}

Hooks.on("renderChatLog", (app, html) => {
    let pool = '<p id="TensionDice-Pool" style="flex-direction:row;flex-wrap:wrap;justify-content:flex-start;text-align:center;align-items:center;"></p>'

    let footer = html.find(".directory-footer");

    if (footer.length === 0) {
    footer = $(`<footer class="directory-footer"></footer>`);
    html.append(footer);
    }
    footer.append(pool);

    let diceinpool = game.settings.get("tension-pool",'diceinpool');
    updatedisplay(diceinpool);

})

async function removedie(){
    let diceinpool = game.settings.get("tension-pool",'diceinpool');
    let maxdiceinpool = game.settings.get("tension-pool",'maxdiceinpool');

    diceinpool -=1

    if (diceinpool<0){
        diceinpool=0
    }


    await sendmessage("Die Removed from Pool ("+diceinpool+"/"+maxdiceinpool+")")
    game.settings.set("tension-pool",'diceinpool',diceinpool);
    await updatedisplay(diceinpool);
    Hooks.call("tension-poolChange", diceinpool);
}

async function adddie(){
    let diceinpool = game.settings.get("tension-pool",'diceinpool');
    let maxdiceinpool = game.settings.get("tension-pool",'maxdiceinpool');

    diceinpool +=1
    await sendmessage("Die Added to Pool ("+diceinpool+"/"+maxdiceinpool+")")

    if ((game.settings.get("tension-pool",'dropdie')) && (diceinpool < game.settings.get("tension-pool", 'maxdiceinpool'))){

        let dicesize = game.settings.get("tension-pool",'dicesize');
        let Ro = new Roll(1+dicesize);
        await Ro.evaluate({async:true})
        game.dice3d.showForRoll(Ro, game.user, false, null);
    }

    game.settings.set("tension-pool",'diceinpool',diceinpool);


    await updatedisplay(diceinpool);
    Hooks.call("tension-poolChange", diceinpool);

    if (diceinpool>=maxdiceinpool){
        await rollpool(diceinpool,"Dice Pool Rolled and Emptied");
    }
}

async function emptypool(){
    let maxdiceinpool = game.settings.get("tension-pool",'maxdiceinpool');
    let diceinpool=0

    await sendmessage("Dice Removed from Pool ("+diceinpool+"/"+maxdiceinpool+")")
    game.settings.set("tension-pool",'diceinpool',diceinpool);

    await updatedisplay(diceinpool);
    Hooks.call("tension-poolChange", diceinpool);
}

async function rollpool(dice,message,dicesize){
    if (dice===0){
        await sendmessage("Dice pool is empty and cannot be rolled")
        return;
    }

    await updatedisplay(dice);
    if (dice!==game.settings.get("tension-pool",'diceinpool')){
        Hooks.call("tension-poolChange", dice);
    }

    await sendmessage(message);

    if (dicesize===undefined) {
        dicesize = game.settings.get("tension-pool",'dicesize');
    }

    let Ro = new Roll(dice+dicesize);
    await Ro.evaluate({async:true})

    let complication;

    if (dicesize==="df"){
        let message = poscName
        Ro.toMessage({flavor: message},{},true)
    } else if (game.settings.get("tension-pool",'outputsum')){
        let message = poscName
        Ro.toMessage({flavor: message},{},true)
    } else {
        await game.dice3d.showForRoll(Ro, game.user, true, null)

        let outcome = Ro.terms[0].results.map(d => d.result).sort()
        console.log(outcome);
        var i;
        complication = false
        let compcount = 0

        let rolltext = ""
        let outcometext = "&nbsp;"

        for (i = 0; i < outcome.length; i++) {
            if (outcome[i] === 1) {
                complication = true
                compcount += 1
                outcometext += "!"
                rolltext += '<li class="roll die ' + dicesize + ' min">!</li>'
            } else {
                rolltext += '<li class="roll die ' + dicesize + '">&nbsp;</li>'
            }
        }

        let mess;
        if (complication) {
            mess = game.settings.get("tension-pool", 'DangerMessage')
        } else {
            mess = game.settings.get("tension-pool", 'SafeMessage')
        }


        mess += `<div class="dice-roll">
                    <div class="dice-result">
                        <div class="dice-formula">`
        mess += dice
        mess += ` dice in pool</div>
                        <div class="dice-tooltip" style="display: none;">
                            <section class="tooltip-part">
                                <div class="dice">
                                    <header class="part-header flexrow">
                                        <span class="part-formula">`
        mess += dice
        mess += ` dice in pool</span>
                                        <span class="part-total">` + compcount + `</span>
                                    </header>
                                    <ol class="dice-rolls">`
        mess += rolltext
        mess += `</ol>
                                </div>
                            </section>
                        </div>
                    <h4 class="dice-total">` + outcometext + `</h4>
                </div>
            </div>`


        sendmessageoveride(mess)
    }
    if (game.settings.get("tension-pool", 'emptythepool')) {
        game.settings.set("tension-pool", 'diceinpool', 0);
        await updatedisplay(0);
    } else if (dice >= game.settings.get("tension-pool", 'maxdiceinpool')) {
        game.settings.set("tension-pool", 'diceinpool', 0);
        await updatedisplay(0);
    }

    Hooks.call("tension-poolRolled", dice,game.settings.get("tension-pool",'diceinpool'),complication);
    console.log(complication);
    return complication;
}

Hooks.on("getSceneControlButtons", (controls) => {
    if (game.user.isGM) {
        controls.push({
            name: "Tension Pool Controls",
            title: "Tension Pool Controls",
            icon: "fas fa-dice",
            layer: "TensionLayer",
            visible: game.user.isGM,
            tools: [
                {
                    name: "tension-pool-removedie",
                    title: "Remove Die from Pool",
                    icon: "fas fa-minus-square",
                    onClick: () => removedie(),
                    visible: game.user.isGM,
                    button: true
                },
                {
                    name: "tension-pool-adddie",
                    title: "Add Dice to Pool",
                    icon: "fas fa-plus-square",
                    onClick: () => adddie(),
                    visible: game.user.isGM,
                    button: true
                },
                {
                    name: "tension-pool-emptypool",
                    title: "Empty the Pool (no roll)",
                    icon: "fas fa-battery-empty",
                    onClick: () => emptypool(),
                    visible: game.user.isGM,
                    button: true
                },
                {
                    name: "tension-pool-rollpool",
                    title: "Roll Dice Pool",
                    icon: "fas fa-dice-six",
                    onClick: () => rollpool(game.settings.get("tension-pool", 'diceinpool'), "Dice Pool Rolled"),
                    visible: game.user.isGM,
                    button: true
                },
                {
                    name: "tension-pool-rollfullpool",
                    title: "Roll Full Dice Pool",
                    icon: "fas fa-dice",
                    onClick: () => rollpool(game.settings.get("tension-pool", 'maxdiceinpool'), "Dice Pool Filled, Rolled and Emptied"),
                    visible: game.user.isGM,
                    button: true
                },
            ],
        });
    }
});

export class Tension {

    async adddie(){
        await adddie()
    }

    async removedie(){
        await removedie()
    }

    async emptypool(){
        await emptypool()
    }

    async rollcurrentpool(){
        await rollpool(game.settings.get("tension-pool", 'diceinpool'), "Dice Pool Rolled")
    }

    async rollfullpool(){
        await rollpool(game.settings.get("tension-pool", 'maxdiceinpool'), "Dice Pool Filled, Rolled and Emptied")
    }
    /**
     * Rolls a custom dice pool
     *
     * @returns {Promise<boolean>} where resolves true if a complication was rolled, false if not.
     * @param dice (int) - the number of dice to be rolled
     * @param message (str) - the message to be displayed in the notification/chat message
     * @param dicesize (str, optional) - sets the size of dice to be used ("dt6" for Tension Dice's ! dice). Default: current dice size in settings
     */

    async rollcustompool(dice,message,dicesize){
        await rollpool(dice,message,dicesize)
    }
}
