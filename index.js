//TODO
//get data from checkbox, append to profiles.json
//----live update json
//get library thing working
//maybe use the tag thing

const {ipcMain, app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const WAD = require("node-wad/src/wad.js")
let window = null
const homedir = require('os').homedir();

const { exec } = require("child_process");

const fs = require( 'fs' )

const ConfigParser = require('configparser');

const config = new ConfigParser();

var dir = '~/doomhub/'

var s;

let rawdata = fs.readFileSync('profiles.json'); //config file location! change when done developing
let data = JSON.parse(rawdata);

function updStat(msg){
    //console.log("updStat: " + msg)
    window.webContents.send('statusUpdate', msg);
}


function updStatErr(msg){
   //console.log("updStatErr: " + msg)
    window.webContents.send('statusUpdateErr', msg);
}

function lookforiwads(win){
    /*window.webContents.send('statusUpdate', 'Looking for Doom.wad...');
    try {
        if (fs.existsSync(path.join(homedir, '/doomhub/iwads/DOOM1.wad'))) {
            updStat("Doom.wad wadwadwadwa")
        } else {
            updStat("Doom.wad not found")
        }
    } catch(err) {
        updStat("Something went horribly wrong. See the console for details.")
        console.error(err)
    }*/
    config.read(path.join(homedir, '/doomhub/games.cfg'));
    fs.readdir(path.join(homedir, '/doomhub/iwads/'), (err, files) => {
        files.forEach(file => {
            //check for doom I
            if(file.toLowerCase() == "doom.wad" || file.toLowerCase() == "doom1.wad"){
                updStat("Doom I found.")
                config.set('DOOM', 'path', path.join(homedir, '/doomhub/iwads/' + file));
                config.set('DOOM', 'visible', 'true');
                config.write(path.join(homedir, '/doomhub/games.cfg'));
                //add this to the json at some point, cfg file is depricated 
            }

            //check for doom II
            if(file.toLowerCase() == "doom2.wad"){
                updStat("Doom II found.")
                config.set('DOOM2', 'path', path.join(homedir, '/doomhub/iwads/' + file));
                config.set('DOOM2', 'visible', 'true');
                config.write(path.join(homedir, '/doomhub/games.cfg'));
            }

            //check for TNT
            if(file.toLowerCase() == "tnt.wad"){
                updStat("TNT found.")
                config.set('TNT', 'path', path.join(homedir, '/doomhub/iwads/' + file));
                config.set('TNT', 'visible', 'true');
                config.write(path.join(homedir, '/doomhub/games.cfg'));
            }

            //check for plutonia
            if(file.toLowerCase() == "plutonia.wad"){
                updStat("Plutonia found.")
                config.set('PLUTONIA', 'path', path.join(homedir, '/doomhub/iwads/' + file));
                config.set('PLUTONIA', 'visible', 'true');
                config.write(path.join(homedir, '/doomhub/games.cfg'));
            }
        });
    });

    for(i in data){
        console.log(i)
        var tmp={
            name:   data[i].metadata.name,
            author: data[i].metadata.author,
            year:   data[i].metadata.year,
            cover:  data[i].metadata.grid
        }
        window.webContents.send('addgame', tmp);
    }
}

app.once('ready', () => {
    window = new BrowserWindow({
        width: 1024,
        height: 768,
        show: false, //prevents flickering
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        frame: false, // this is a requirement for transparent windows it seems
        show: true,
        blur: true,
        blurType: "blurbehind",
        blurGnomeSigma: 100,
        blurCornerRadius: 20,
        vibrancy: "fullscreen-ui",
            frame: false,
            transparent: true
        })
    window.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))
    window.once('ready-to-show', () => {
        window.show()
        lookforiwads(window)
    })
    window.on('closed', function () {
        mainWindow = null
    })
})

ipcMain.on('launchGame', (evt, arg) => {
    console.log(arg) //arg is basically the game name so u can parse the json easily

    bin = data[arg].game.sourceport
    iwad = data[arg].game.iwad
    mods = ""
    if(data[arg].game.modded){
        for(modfile in data[arg].game.mods){
            mods = mods + " -file " + data[arg].game.mods[modfile]
        }
    }
    cmd = `${bin} -iwad ${iwad} ${mods}`

    console.log(`output command: ${cmd}`)
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
})

ipcMain.on('close-me', (evt, arg) => {
    app.quit()
})

ipcMain.on('min-me', (evt, arg) => {
    window.minimize()
})

ipcMain.on('max-me', (evt, arg) => {
    window.isMaximized() ? window.restore() : window.maximize()
})

ipcMain.on('newWindowWithData', (evt, arg) => {
    console.log("Received")
    console.log(arg)
})

ipcMain.on('removeOverlay', (evt, arg) => {
    console.log("AAAA")
    window.webContents.send('removeOverlay', 'true');
})

ipcMain.on('updateConfig', (evt, arg) => {
    console.log(arg)
    temp = JSON.stringify(arg)
    // Use fs.readFile() method to read the file
    fs.readFile('./profiles.json', 'utf8', function(err, originalData){
        let originalJson = JSON.parse(originalData);
        tempJson = JSON.parse(temp);
        originalJson.push(tempJson)
        console.log(tempJson)
        fs.writeFile('./profiles.json', tempJson, err => {
            if (err) {
                console.log('Error writing file', err)
            } else {
                console.log('Successfully wrote file')
            }
        })
    })
})