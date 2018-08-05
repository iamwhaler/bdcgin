import React, { Component } from 'react';
import classNames from 'classnames';
import _ from 'lodash';

import './css/footer.css';
import './css/App.css';

import {game_name} from './game/app_config';
import {getDefaultState} from './game/default_state';
import {checkPlayerStats} from './game/game_math';
import {actions} from './game/actions';

//import {GinButton} from './core/GinButton';
import {frame} from './core/frame';
import {tick} from './core/tick';
import {isEnough, chargeCost, drawCost} from './core/bdcgin';



class App extends Component {
    constructor(props) {
        super(props);

        this.timerID = null;

        this.playGame = this.playGame.bind(this);
        this.pauseGame = this.pauseGame.bind(this);
        this.setGameSpeed = this.setGameSpeed.bind(this);
        this.tick = this.tick.bind(this);
        this.newGame = this.newGame.bind(this);

        this.state = getDefaultState();

    }


    componentDidMount() {
        console.log('App '+game_name+' componentDidMount');
        var app_state = JSON.parse(localStorage.getItem(game_name+"_app_state"));
        this.setState(app_state ? app_state : getDefaultState());
        this.playGame();
    }

    playGame(speed_multiplier = false) {
        clearInterval(this.timerID);
        this.timerID = setInterval(
            () => this.frame(),
            Math.floor(this.state.game_speed / this.state.frame_rate / (speed_multiplier ? speed_multiplier : this.state.game_speed_multiplier))
        );
        this.setState({game_paused: false});
    }

    pauseGame() {
        clearInterval(this.timerID);
        this.setState({game_paused: true});
    }

    setGameSpeed(speed) {
        if (!this.state.game_paused) this.playGame(speed);
        this.setState({game_speed_multiplier: speed});
    }

    newGame() {
        // if (!window.confirm('Are you ready to start a new game? Your progress will be lost.')) return false;
        localStorage.setItem(game_name+"_app_state", null);
        let new_state = getDefaultState();
        this.setState(new_state);
        this.playGame(new_state.game_speed_multiplier);
    }

    frame() {
        let state = this.state;

        if (state.frame % state.frame_rate === 0) {
            state = this.tick(state);
            state.tick++;
        }

        state = frame(this.state);
        state.frame++;

        localStorage.setItem(game_name+"_app_state", JSON.stringify(state));
        this.setState(state);
        if (state.game_end) this.pauseGame();
    }

    tick(initial_state) {
        let state = tick(initial_state);
    //    localStorage.setItem(game_name+"_app_state", JSON.stringify(state));
        return state; // this.setState(state);
    }


    onClickWrapper(item) {
        console.log(item);
        if (item.isDisabled && item.isDisabled(this.state)) {
            return false;
        }
        if (item.cost) {
            if (isEnough(this.state, item.cost)) {
                if (item.onClick) this.setState(item.onClick(chargeCost(this.state, item.cost)));
            }
            else {
                return false;
            }
        }
        else {
            if (item.onClick) this.setState(item.onClick(this.state));
        }
    }

    changeTab(tab_name) {
        this.setState({tab: tab_name});
    }


    render() {
        let state = this.state;

        //console.log(state.target);

        const GinButton = (props) => {
            let item = props.item;
            return (item.isLocked && item.isLocked(this.state))
                ? ''
                :
                <button
                    className={(item.isDisabled && item.isDisabled(this.state)) ? 'disabled' : (item.cost ? isEnough(this.state, item.cost) ? '' : 'disabled' : '')}
                    onClick={() => { this.onClickWrapper(item); }}>
                    {item.name}
                </button>
        };

        const time_panel =
            <div className="flex-element">
                <span onClick={() => {
                    if (this.state.game_paused) {
                        this.playGame();
                    } else {
                        this.pauseGame();
                    }
                }}>
                    <span className={classNames('glyphicon', (this.state.game_paused ? 'glyphicon-play' : 'glyphicon-pause'))} style={{width: 28, height: 28}}> </span>
                </span>
            <span>
                {[1, 4, 16, 64].map((speed, index) => {
                    return <span key={index}>
                        {this.state.game_speed_multiplier === speed
                            ? <button className="" style={{width: 42, height: 28}}><u>{{0: 'x1', 1: 'x4',  2: 'x16',  3: 'x64'}[index]}</u></button>
                            : <button className="" style={{width: 42, height: 28}} onClick={() => {
                            this.setGameSpeed(speed); }}>{{0: 'x1', 1: 'x4',  2: 'x16',  3: 'x64'}[index]}
                        </button>}
                    </span>
                })}
                </span>
        </div>;

        const chat_subcomponent =
            <div className="flex-element">
                {_.map(state.chat, (item, key) =>
                    <div key={key}>
                        {item.text}
                    </div>
                )}
            </div>;


        const player_subcomponent =
            <div className="flex-element panel">
                <div className="small">Player</div>
                <div className="small"> with {state.player.weapon.name} </div>
                <div className="small"> LVL: {state.player.level} ({state.player.expr}/{100 * state.player.level}) </div>
                <div className="small"> HP: {state.player.hp}/{state.player.max_hp} </div>
                <div className="small"> SP: {state.player.sp}/{state.player.max_sp} </div>
                <div className="small"> MP: {state.player.mp}/{state.player.max_mp} </div>
                <div className="small"> STR: {state.player.stats.str} <GinButton item={{name: "+1", isLocked: (state) => !state.player.bonus_points, onClick: (state) => { state.player.stats.str++; state.player.bonus_points--; return checkPlayerStats(state); } }} /> </div>
                <div className="small"> DEX: {state.player.stats.dex} <GinButton item={{name: "+1", isLocked: (state) => !state.player.bonus_points, onClick: (state) => { state.player.stats.dex++; state.player.bonus_points--; return checkPlayerStats(state); } }} /> </div>
                <div className="small"> INT: {state.player.stats.int} <GinButton item={{name: "+1", isLocked: (state) => !state.player.bonus_points, onClick: (state) => { state.player.stats.int++; state.player.bonus_points--; return checkPlayerStats(state); } }} /> </div>
                <div className="small"> Delay: {state.player.action_timer} </div>
            </div>;

        const weapon_subcomponent =
            <div className="flex-element panel">
                <div className="small">{state.player.weapon.name}</div>
                <div className="small">Damage: {state.player.weapon.min_dmg} - {state.player.weapon.max_dmg}</div>
                <div className="small">Accuracy: {state.player.weapon.accuracy}</div>
                <div className="small">Range: {state.player.weapon.range}</div>
                <div className="small">Speed: {state.player.weapon.speed}</div>
                <div className="small">Cost: {state.player.weapon.cost}</div>
            </div>;

        const money_subcomponent =
            <div className="flex-element panel">
                <h6>Player</h6>
                <h5>{state.player.name}</h5>
                <h6>Money: {state.player.money}</h6>
                <h6>Win: {state.wins}</h6>
                <h6>Loose: {state.looses}</h6>
            </div>;

        const target_subcomponent =
            <div className="flex-element panel">
                <div className="small">{state.target.name}</div>
                <div className="small"> with {state.target.weapon.name} </div>
                <div className="small"> LVL: {state.target.level} ({Math.floor((41 + state.target.level) * state.target.level / state.player.level)} expr) </div>
                <div className="small"> HP: {state.target.hp}/{state.target.max_hp} </div>
                <div className="small"> SP: {state.target.sp}/{state.target.max_sp} </div>
                <div className="small"> MP: {state.target.mp}/{state.target.max_mp} </div>
                <div className="small"> STR: {state.target.stats.str} </div>
                <div className="small"> DEX: {state.target.stats.dex} </div>
                <div className="small"> INT: {state.target.stats.int} </div>
                <div className="small"> Delay: {state.target.action_timer} </div>
            </div>;

        const battle_ground_subcomponent =
            <div className="flex-element panel">
                <h5>Battle Ground</h5>
                <div className="flex-container-row">
                    <div className="flex-element"> Player: {state.battleground.player} </div>
                    <div className="flex-element"> Target: {state.battleground.target} </div>
                </div>
            </div>;

        const actions_subcomponent =
            <div className="flex-element">
                <div className="panel">
                    <h4>actions</h4>

                    <div className="flex-container-row">
                        <div className="flex-element"> <GinButton item={actions.move_left}/> </div>
                        <div className="flex-element"> <GinButton item={actions.move_right}/> </div>
                    </div>
                    <div className="flex-container-row">
                        <div className="flex-element"> <GinButton item={actions.run_left}/> </div>
                        <div className="flex-element"> <GinButton item={actions.run_right}/> </div>
                    </div>
                    <div className="flex-container-row">
                        <div className="flex-element"> <GinButton item={actions.roll}/> </div>
                        <div className="flex-element"> <GinButton item={actions.hit}/> </div>
                    </div>
                    <div className="flex-container-row">
                        <div className="flex-element"> <GinButton item={actions.heal}/> </div>
                        <div className="flex-element"> <GinButton item={actions.fire}/> </div>
                    </div>
                </div>
            </div>;

        const arena_subcomponent =
            <div>
                <div className="flex-container-row">
                    {player_subcomponent}
                    {target_subcomponent}
                </div>

                {state.in_fight === true ? battle_ground_subcomponent : ''}

                <div className="flex-container-row">
                    {state.in_fight === true ? actions_subcomponent :
                        <div className="flex-element">
                            <GinButton item={{name: "Start Fight!", isLocked: (state) => state.in_fight,
                                onClick: (state) => { state.in_fight = true; state.chat = []; return state; } }} />
                        </div>
                    }
                    {state.chat.length > 0 ?
                        <div className="flex-element panel">
                            <h5>chat</h5>
                            {chat_subcomponent}
                        </div> : ''}
                    </div>
            </div>;

        const character_subcomponent =
            <div>
                <div className="flex-container-row">
                    {player_subcomponent}
                    {weapon_subcomponent}
                </div>
            </div>;

        const inventory_subcomponent =
            <div>
                <div className="flex-container-row">
                    {money_subcomponent}
                    {weapon_subcomponent}
                </div>

                { state.inventory.length > 0 ?
                <div className="panel">
                    <div className="flex-container-row">
                        <div className="flex-element">Name</div>
                        <div className="flex-element">Damage</div>
                        <div className="flex-element">Accuracy</div>
                        <div className="flex-element">Speed</div>
                        <div className="flex-element">Equip</div>
                        <div className="flex-element">Sell</div>
                    </div>
                    <div className="flex-container-column">
                        {_.map(state.inventory, (item, key) =>
                            <div className="flex-element flex-container-row" key={key}>
                                <div className="flex-element">{item.name}</div>
                                <div className="flex-element">{item.min_dmg} - {item.max_dmg}</div>
                                <div className="flex-element">{item.accuracy}</div>
                                <div className="flex-element">{item.speed}</div>
                                <div className="flex-element">
                                    <GinButton item={{name: "equip", isLocked: (state) => state.in_fight,
                                        onClick: (state) => {
                                            state.inventory[key] = state.player.weapon;
                                            state.player.weapon = item;
                                            return state; } }} />
                                </div>
                                <div className="flex-element">
                                    <GinButton item={{name: "sell $"+item.cost, isLocked: (state) => state.in_fight,
                                        onClick: (state) => {
                                            state.player.money += item.cost;
                                            state.inventory.splice(key, 1);
                                            return state; } }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div> : ""}
            </div>;

        const options_subcomponent =
            <div className="flex-container-column panel">
                <div className="flex-element">
                    <button onClick = {this.newGame}>New game</button>
                </div>
                <div className="flex-element flex-container-column">
                    <div className="flex-element">
                        <h4>Round: {this.state.tick} Turn: {this.state.frame} </h4>
                    </div>
                    {time_panel}
                </div>
            </div>;


        return (
            <div className="App">
                <div className="fat content_container" role="main">
                    {this.state.tab === 'start' ?
                        <div>START</div>
                        : ''}

                    {this.state.tab === 'end' ?
                        <div className="col-xs-10 col">
                            <h2>Game End! Score: {this.state.game_end_score}</h2>
                            <h3><a className="btn btn-warning" onClick={this.newGame} title='Try One More Time'> New Game </a></h3>
                        </div>
                        : ''}

                    {this.state.tab === 'arena' ?
                        <div>{arena_subcomponent}</div>
                        : ''}

                    {this.state.tab === 'character' ?
                        <div>{character_subcomponent}</div>
                        : ''}

                    {this.state.tab === 'inventory' ?
                        <div> {inventory_subcomponent}</div>
                        : ''}

                    {this.state.tab === 'options' ?
                        <div> {options_subcomponent}</div>
                        : ''}

                    <div className="footer row">
                        <span className="col-xs filament"><a onClick={() => { this.changeTab('arena'); }} title='Arena'>Arena</a></span>
                        <span className="col-xs filament"><a onClick={() => { this.changeTab('character'); }} title='Character'>Character</a></span>
                        <span className="col-xs filament"><a onClick={() => { this.changeTab('inventory'); }} title='Inventory'>Inventory</a></span>
                        <span className="col-xs filament"><a onClick={() => { this.changeTab('options'); }} title='Options'>Options</a></span>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;