
import _ from 'lodash';

import {genWeapon} from './weapons';
import {genArmor} from './armors';


const targets_bodies = {
    sparrer:    {name: "Sparrer",   hp: 0, sp: 0, mp: 0, stats: {str: 1, con: 1, dex: 1, wiz: 1, int: 1}},
    barbarian:  {name: "Barbarian", hp: 5, sp: 0, mp: 0, stats: {str: 1, con: 1, dex: 1, wiz: 1, int: 1}},
    ranger:     {name: "Ranger",    hp: 0, sp: 3, mp: 0, stats: {str: 1, con: 1, dex: 1, wiz: 1, int: 1}},
    mage:       {name: "Mage",      hp: 0, sp: 0, mp: 2, stats: {str: 1, con: 1, dex: 1, wiz: 1, int: 1}},
    warrior:    {name: "Warrior",   hp: 3, sp: 2, mp: 0, stats: {str: 1, con: 1, dex: 1, wiz: 1, int: 1}},
    battlemage: {name: "Warmage",   hp: 3, sp: 0, mp: 1, stats: {str: 1, con: 1, dex: 1, wiz: 1, int: 1}},
    trickster:  {name: "Trickster", hp: 0, sp: 2, mp: 1, stats: {str: 1, con: 1, dex: 1, wiz: 1, int: 1}},
};

const targets_quality = {
    1: {name: "Weak",     hp: 0, sp: 0, mp: 0, stats: {str: 0, con: 0, dex: 0, wiz: 0, int: 0}},
    2: {name: "Novice",   hp: 1, sp: 1, mp: 0, stats: {str: 0, con: 0, dex: 0, wiz: 0, int: 0}},
    3: {name: "Standard", hp: 2, sp: 1, mp: 1, stats: {str: 1, con: 1, dex: 1, wiz: 1, int: 1}},
    4: {name: "Grete",    hp: 3, sp: 2, mp: 1, stats: {str: 1, con: 1, dex: 1, wiz: 1, int: 1}},
    5: {name: "Shiny",    hp: 4, sp: 2, mp: 2, stats: {str: 2, con: 2, dex: 2, wiz: 2, int: 2}},
    6: {name: "Godlike",  hp: 5, sp: 3, mp: 2, stats: {str: 2, con: 2, dex: 2, wiz: 2, int: 2}},
};

const targets_mods = {
    heavy: {name: "Heavy",         hp: 6, sp: -2, mp: -1, stats: {str: 2, con: 1, dex: -1, wiz: -1, int: -1}},
    healthy: {name: "Healthy",     hp: 3, sp: 0, mp: -1, stats: {str: 1, con: 2, dex: 0, wiz: -1, int: -2}},
    nimble: {name: "Nimble",       hp: -3, sp: 4, mp: -1, stats: {str: -1, con: -1, dex: 2, wiz: -1, int: 1}},
    wise: {name: "Wise",           hp: 0, sp: -4, mp: 2, stats: {str: -1, con: -1, dex: -1, wiz: 2, int: 1}},
    brilliant: {name: "Smart",     hp: -3, sp: -2, mp: 2, stats: {str: -1, con: -1, dex: 0, wiz: 0, int: 2}},

    athlete: {name: "Athlete",     hp: 3, sp: 2, mp: -2, stats: {str: 1, con: 1, dex: 2, wiz: -2, int: -2}},
    forceful: {name: "Force",      hp: 3, sp: -4, mp: 1, stats: {str: 2, con: 0, dex: -2, wiz: 2, int: -2}},
    lifeful: {name: "Lifeful",     hp: 6, sp: 0, mp: -2, stats: {str: 1, con: 2, dex: 1, wiz: -2, int: -2}},
    sly: {name: "Sly",             hp: -6, sp: 2, mp: 1, stats: {str: -2, con: -1, dex: 2, wiz: -1, int: 2}},
    spellful: {name: "Spellful",   hp: -3, sp: -2, mp: 2, stats: {str: -2, con: -2, dex: 0, wiz: 2, int: 2}},
    flat: {name: "Typical",        hp: 0, sp: 0, mp: 0, stats: {str: 0, con: 0, dex: 0, wiz: 0, int: 0}},
};


export const genTarget = (level = 1) => {
    let body = level === 1 ? targets_bodies.sparrer : _.sample(targets_bodies);
    let q = Math.floor(Math.min(_.random(1, 6), _.random(1, Math.sqrt(level))));
    //console.log('quality', q);
    let quality = targets_quality[q];
    let mod = level === 1 ? targets_mods.flat : _.sample(targets_mods);

    let target = {
        name: mod.name + ' ' + quality.name + ' ' + body.name,
        level: level,
        hp: 10,
        max_hp: 10,
        sp: 10,
        max_sp: 10,
        mp: 10,
        max_mp: 10,
        stats: {
            str: 1,
            con: 1,
            dex: 1,
            wiz: 1,
            int: 1
        },
        weapon: genWeapon(level),
        armor: genArmor(level),
        action_timer: 0,
        action: null, // до конца action
        effects: {}, // до конца боя
    };

    _.times(level - 1, () => { target.stats[_.sample(_.keys(target.stats))]++; } );

    target.stats.str = Math.max(1, quality.stats.str + mod.stats.str + body.stats.str);
    target.stats.dex = Math.max(1, quality.stats.dex + mod.stats.dex + body.stats.dex);
    target.stats.con = Math.max(1, quality.stats.con + mod.stats.con + body.stats.con);
    target.stats.wiz = Math.max(1, quality.stats.wiz + mod.stats.wiz + body.stats.wiz);
    target.stats.int = Math.max(1, quality.stats.int + mod.stats.int + body.stats.int);

    let hp = level * Math.max(1, 14 + target.stats.con + quality.hp + mod.hp + body.hp);
    target.hp = hp;
    target.max_hp = hp;

    let sp = level * Math.max(1, 9 + target.stats.str + quality.sp + mod.sp + body.sp);
    target.sp = sp;
    target.max_sp = sp;

    let mp = level * Math.max(1, 2 + target.stats.wiz + quality.mp + mod.mp + body.mp);
    target.mp = mp;
    target.max_mp = mp;


    console.log('Gen Target: ', level, body, quality, mod, target);

    return target;
};


