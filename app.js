class SelectArea {
    constructor(parent) {
        this.selected = [];
        this.pos = {
            x: 0, y: 0
        };
        this.parent = parent;
        this.parent
            .find( '*' )
            .attr( 'draggable', 'false' )
            .attr( 'unselectable', 'on' );
    }

    #instantiate() {
        this.elem = $(`<div class="selector" draggable="false"></div>`);
        this.elem.addClass( 'unselectable' )
            .attr( 'unselectable', 'on' )
            .attr( 'draggable', 'false' )
            .on( 'dragstart', function() { return false; } );
        this.parent.append(this.elem);
    }

    start(startX, startY) {
        this.selected.forEach((value) => {
            value.classList.remove("selected");
        })
        this.selected = [];

        this.#instantiate();
        this.pos.x = startX;
        this.pos.y = startY;
        this.elem.css("left", startX + "px");
        this.elem.css("top", startY + "px");
    }

    move(newX, newY) {
        let startPos = {
            x: this.pos.x, y: this.pos.y
        };

        let deltaPos = {
            x: newX, y: newY
        };

        if (startPos.x === deltaPos.x || startPos.y === deltaPos.y) return;
        if (startPos.x > deltaPos.x) {
            startPos.x += deltaPos.x;
            deltaPos.x = startPos.x - deltaPos.x;
            startPos.x -= deltaPos.x;
        }
        if (startPos.y > deltaPos.y) {
            startPos.y += deltaPos.y;
            deltaPos.y = startPos.y - deltaPos.y;
            startPos.y -= deltaPos.y;
        }

        this.elem.css("top", startPos.y + "px");
        this.elem.css("left", startPos.x + "px");
        this.elem.css("width", deltaPos.x - startPos.x + "px");
        this.elem.css("height", deltaPos.y - startPos.y + "px");

        this.#select(startPos, deltaPos);
    }

    #select(startPos, deltaPos) {
        this.parent.children().each((index, currentNode) => {
            if (currentNode.classList.contains("selector")) return;
            if (this.#selectorIntersects3(startPos,deltaPos,currentNode)) {
                if (!this.selected.includes(currentNode)) this.selected.push(currentNode);
                currentNode.classList.add("selected");
            } else {
                currentNode.classList.remove("selected");
            }
        });
    }

    #selectorIntersects3(startPos, deltaPos, object) {
        const a = {
            x: startPos.x, y: startPos.y,
            x1: deltaPos.x, y1: deltaPos
        };
        const b = {
            x: object.offsetLeft, y: object.offsetTop,
            x1: object.offsetLeft + object.offsetWidth, y1: object.offsetTop + object.offsetHeight

        }
        return !( a.y > b.y1 || a.y1 < b.y || a.x1 < b.x || a.x > b.x1 );
    }

    end() {
        this.elem?.remove();
    }

    get selectedObjects() {
        return this.selected;
    }
}
class SelectAreaHandler {
    constructor(parent) {
        this.selector = new SelectArea(parent);
        this.isMouseDown = false;
        this.clickedPos = {
            x: 0, y: 0
        };

        this.mouseUp = parent.on("mouseup", (event) => {
            this.isMouseDown = false;
            this.selector.end();
        })

        this.mouseDown = parent.on("mousedown", (event) => {
            this.isMouseDown = true;
            this.clickedPos = {
                x: event.pageX, y: event.pageY
            };

            this.selector.start(this.clickedPos.x, this.clickedPos.y);
            this.selector.move(event.pageX, event.pageY);
        })

        this.mouseMove = parent.on("mousemove", (event) => {
            if (this.isMouseDown) {
                this.selector.move(event.pageX, event.pageY);
            }
        })
    }

    get selectedObjects() {
        return this.selector.selectedObjects;
    }
}
class KeyboardHandler {
    constructor(parent) {
        this.events = { };
        this.keysPressed = new Set();

        parent.on("keydown", (event) => {
            event.key = event.key.toLowerCase();
            const promise = new Promise(resolve => {
                if (!this.keysPressed.has(event.key)) {
                    this.events[event.key]();
                    this.keysPressed.add(event.key);
                }
            }, reject => {
                return new Error("Invalid operation");
            });
            promise.catch((reason) => {});
        });

        parent.on("keyup", (event) => {
            event.key = event.key.toLowerCase();
            const promise = new Promise(resolve => {
                if (this.keysPressed.has(event.key)) this.keysPressed.delete(event.key);
            }, reject => {
                return new Error("Invalid operation");
            });
            promise.catch((reason) => {});
        });
    }

    handle(key, callback) {
        this.events[key.toLowerCase()] = callback;
    }
}

const keyboardHandler = new KeyboardHandler($("body"));
const selector = new SelectAreaHandler($(".select-area"));

keyboardHandler.handle("delete", () => {
    if (!confirm("Are you sure you want to delete selected objects?")) return;
    selector.selectedObjects.forEach((value) => {
        value.remove();
    });
})
