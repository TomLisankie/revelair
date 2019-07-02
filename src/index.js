import {RevelairCanvas} from "./RevelairCanvas";

document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("canvas");
    var currentCanvas = new RevelairCanvas();
    var context = canvas.getContext("2d");

    $(".image-load").on("change", function(event) {
        console.log("loading image");
        let reader = new FileReader();
        reader.onload = function(event) {
            currentCanvas.replaceImage(event.target.result, context);
            //currentCanvas.initialDraw(context);
        };
        reader.readAsDataURL(event.target.files[0]);

    });

    function getMousePosition(canvas, e) {
        let rect = canvas.getBoundingClientRect();
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }

    $("canvas").on("mousedown", (event) => {
        let mousePosition = getMousePosition(canvas, event);
        clicked(mousePosition);
    });

    function clicked(mousePosition) {
        currentCanvas.addPoint([mousePosition.x, mousePosition.y]);
        for(let i = 0; i < 4; i++) {
            currentCanvas.addPoint([mousePosition.x + ((i+1) * 50), mousePosition.y]);
        }
        currentCanvas.draw(context);
    }

    function keyPlayed(mousePosition) {
        currentCanvas.addPoint([mousePosition.x, mousePosition.y]);
        for(let i = 0; i < 4; i++) {
            currentCanvas.addPoint([mousePosition.x + ((i+1) * 50), mousePosition.y]);
        }
        currentCanvas.draw(context);
    }

    const keys = document.querySelectorAll(".key"),
            note = document.querySelector(".nowplaying"),
            hints = document.querySelectorAll(".hints");

    function playNote(e) {
        const audio = document.querySelector(`audio[data-key="${e.keyCode}"]`),
        key = document.querySelector(`.key[data-key="${e.keyCode}"]`);

        if (!key) return;

        const keyNote = key.getAttribute("data-note");
        console.log(keyNote);
        if(keyNote == currentCanvas.song[0]) {
            keyPlayed({
                x: Math.floor(Math.random() * RevelairCanvas.DIM_X),
                y: Math.floor(Math.random() * RevelairCanvas.DIM_Y)
            });
            currentCanvas.song.shift();
            console.log(currentCanvas.song);
        }
        key.classList.add("playing");
        note.innerHTML = keyNote;
        audio.currentTime = 0;
        audio.play();
    }

    function removeTransition(e) {
        if (e.propertyName !== "transform") return;
        this.classList.remove("playing");
    }
      
    function hintsOn(e, index) {
        e.setAttribute("style", "transition-delay:" + index * 50 + "ms");
    }
    
    hints.forEach(hintsOn);
    
    keys.forEach(key => key.addEventListener("transitionend", removeTransition));
    
    window.addEventListener("keydown", playNote);

    function generatePoints(pointCount) {
        for(let i = 0; i < pointCount; i++){
            currentCanvas.addPoint([Math.floor(Math.random() * RevelairCanvas.DIM_X), 
                Math.floor(Math.random() * RevelairCanvas.DIM_Y)]);
        }
    }

    generatePoints(256);
    console.log(currentCanvas.getPoints());

});