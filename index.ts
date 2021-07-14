class Cell {
    public isAlive: boolean;
    private nextStatus: boolean;

    private age: number;
    public posX: number;
    public posY: number;

    // 
    public neighborsArray: Cell[];

    private context: CanvasRenderingContext2D;

    constructor(isAlive: boolean, x: number, y: number, context: CanvasRenderingContext2D) {
        this.posX = x;
        this.posY = y;
        this.age = 0;
        this.isAlive = isAlive;
        this.nextStatus = isAlive;

        this.neighborsArray = [];

        this.context = context;
    }

    public setNextStatus(): boolean {
        let aliveNeighborsCount = 0;
        let statusHasChanged = false;
        for (let neighbor of this.neighborsArray) {
            if (neighbor.isAlive) {
                aliveNeighborsCount++;
            }
        }
        if (this.isAlive) {
            if (aliveNeighborsCount < 2 || aliveNeighborsCount > 3) {
                this.nextStatus = false;
                statusHasChanged = true;
            } else {
                this.age++;
                this.nextStatus = true;
            }
        } else {
            if (aliveNeighborsCount == 3) {
                this.nextStatus = true;
                statusHasChanged = true;
            } else {
                this.nextStatus = false;
            }
        }
        return statusHasChanged;
    }

    public update(): void {
        if (this.nextStatus == true && !this.isAlive) {
            this.resurrect()
        } else if (this.nextStatus == false && this.isAlive) {
            this.die();
        }
    }

    public die(): void {
        this.nextStatus = false;
        this.isAlive = false;
    }

    public resurrect(): void {
        this.nextStatus = true;
        this.isAlive = true;
        this.age = 0;
    }

    public draw(): void {
        if (this.isAlive) {
            this.context.fillStyle = "black";
            this.context.fillRect(this.posX * 10, this.posY * 10, 10, 10);
        }
    }
}

class Game {
    private cellArray: Cell[][];
    private livingCellsArray: Cell[];

    private fieldWidth: number;
    private fieldHeight: number;

    private iterationNumber: number = 0;

    private isPaused: boolean = true;
    private currentGameSpeed: number = 1000;
    private timerID: number;

    private mouseIsHeld: boolean = false;

    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    // Container and inputs
    private containerElement: HTMLElement;
    private widthInput: HTMLInputElement;
    private heightInput: HTMLInputElement;
    private speedInput: HTMLInputElement;

    // Buttons
    private setDimensionsButton: HTMLElement;
    private populateButton: HTMLElement;
    private flyersButton: HTMLElement;
    private clearButton: HTMLElement;
    private oneIterationButton: HTMLElement;

    // Radios
    private drawRadio: HTMLInputElement;
    private eraseRadio: HTMLInputElement;

    private resumeRadio: HTMLInputElement;
    private pauseRadio: HTMLInputElement;

    //private resumeButton: HTMLElement;
    //private pauseButton: HTMLElement;

    // Spans
    private iterationNumberElement: HTMLElement;

    constructor(width: number, height: number) {
        this.fieldWidth = width;
        this.fieldHeight = height;

        this.canvas = <HTMLCanvasElement>document.getElementById("field");
        this.canvas.addEventListener("mousedown", this.onCanvasClick.bind(this));
        this.canvas.addEventListener("mouseup", this.onCanvasClick.bind(this));
        this.canvas.addEventListener("mousemove", this.onCanvasClick.bind(this));
        this.context = this.canvas.getContext("2d");

        // Container and inputs
        this.containerElement = document.getElementById("container");
        this.widthInput = document.getElementById("width-input") as HTMLInputElement;
        this.heightInput = document.getElementById("height-input") as HTMLInputElement;
        this.speedInput = document.getElementById("speed-input") as HTMLInputElement;
        this.speedInput.addEventListener("input", this.changeGameSpeed.bind(this));

        // Buttons
        this.setDimensionsButton = document.getElementById("set-dimensions-button");
        this.setDimensionsButton.addEventListener("click", this.setCanvasDimensions.bind(this));
        this.populateButton = document.getElementById("populate-button");
        this.populateButton.addEventListener("click", this.randomlyPopulateField.bind(this));
        this.flyersButton = document.getElementById("flyers-button");
        this.flyersButton.addEventListener("click", this.populateWithFlyers.bind(this));
        this.clearButton = document.getElementById("clear-button");
        this.clearButton.addEventListener("click", this.resetGame.bind(this));
        this.oneIterationButton = document.getElementById("one-iteration-button");
        this.oneIterationButton.addEventListener("click", this.doOneIteration.bind(this));

        // Radios
        this.drawRadio = document.getElementById("draw-radio") as HTMLInputElement;
        this.eraseRadio = document.getElementById("erase-radio") as HTMLInputElement;

        this.resumeRadio = document.getElementById("resume-radio") as HTMLInputElement;
        this.resumeRadio.addEventListener("change", this.onPlayerControlRadioChange.bind(this));
        this.pauseRadio = document.getElementById("pause-radio") as HTMLInputElement;
        this.pauseRadio.addEventListener("change", this.onPlayerControlRadioChange.bind(this));

        //this.resumeButton = document.getElementById("resume-button");
        //this.resumeButton.addEventListener("click", this.resumeGame.bind(this));
        //this.pauseButton = document.getElementById("pause-button");
        //this.pauseButton.addEventListener("click", this.pauseGame.bind(this));

        // Spans
        this.iterationNumberElement = document.getElementById("iteration-number");

        this.drawRadio.checked = true;
        this.resetGame();
    }

    private setCanvasDimensions(): void {
        this.resetGame();
        let newWidth = parseInt(this.widthInput.value) * 10;
        let newHeight = parseInt(this.heightInput.value) * 10;
        this.fieldWidth = parseInt(this.widthInput.value);
        this.fieldHeight = parseInt(this.heightInput.value);
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.containerElement.style.width = (newWidth + 200).toString() + "px";
        this.containerElement.style.height = (newHeight + 200).toString() + "px";
    }

    private changeGameSpeed(): void {
        let speedInSeconds = parseFloat(this.speedInput.value);
        let newSpeed = Math.floor(speedInSeconds * 1000);
        this.currentGameSpeed = newSpeed;
    }

    private onPlayerControlRadioChange(): void {
        if (this.resumeRadio.checked) {
            this.resumeGame();
        } else if (this.pauseRadio.checked) {
            this.pauseGame();
        }
    }

    private resumeGame(): void {
        if (this.isPaused) {
            this.isPaused = false;
            this.resumeRadio.checked = true;
            this.doIteration();
            this.timerID = setTimeout(() => this.updateTimer(), this.currentGameSpeed);
        }
    }

    private pauseGame(): void {
        if (!this.isPaused) {
            this.isPaused = true;
            this.pauseRadio.checked = true;
            clearTimeout(this.timerID);
        }
    }

    private updateTimer(): void {
        if (!this.isPaused) {
            this.doIteration();
            setTimeout(() => this.updateTimer(), this.currentGameSpeed);
        }
    }

    private doOneIteration(): void {
        this.pauseGame();
        this.doIteration();
    }

    private doIteration(): void {
        if (this.livingCellsArray.length == 0) {
            this.resetGame();
        } else {
            this.iterationNumber++;
            this.iterationNumberElement.innerHTML = this.iterationNumber.toString();

            let cellsToSetNextStatus: Cell[] = [];
            for (let livingCell of this.livingCellsArray) {
                for (let neighbor of livingCell.neighborsArray) {
                    if (!cellsToSetNextStatus.includes(neighbor)) {
                        cellsToSetNextStatus.push(neighbor);
                    }
                }
                if (!cellsToSetNextStatus.includes(livingCell)) {
                    cellsToSetNextStatus.push(livingCell);
                }
            }
            let cellsToUpdate: Cell[] = [];
            for (let cell of cellsToSetNextStatus) {
                if (cell.setNextStatus()) {
                    cellsToUpdate.push(cell);
                }
            }

            for (let cell of cellsToUpdate) {
                cell.update();
                if (cell.isAlive) {
                    this.createCellNeighbors(cell);
                    this.appendLivingCell(cell);
                } else {
                    this.removeLivingCell(cell);
                }
            }
            this.redrawField();
        }
    }

    private redrawField(): void {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let livingCell of this.livingCellsArray) {
            livingCell.draw();
        }
    }

    private appendLivingCell(cell: Cell): void {
        if (!this.livingCellsArray.includes(cell)) {
            this.livingCellsArray.push(cell);
        }
    }

    private removeLivingCell(cell: Cell): void {
        this.livingCellsArray.splice(this.livingCellsArray.indexOf(cell), 1);
    }

    private fillNeighborsArrayForCell(cell: Cell): void {
        let horMin = cell.posX - 1; let horMax = cell.posX + 1;
        for (let x = horMin; x <= horMax; x++) {
            let vertMin = cell.posY - 1; let vertMax = cell.posY + 1;
            for (let y = vertMin; y <= vertMax; y++) {
                let coordX = x; let coordY = y;
                if (coordX < 0)
                    coordX = this.fieldWidth - 1;
                else if (x > this.fieldWidth - 1)
                    coordX = 0;
                if (coordY < 0)
                    coordY = this.fieldHeight - 1;
                else if (coordY > this.fieldHeight - 1)
                    coordY = 0;
                if (coordX != cell.posX || coordY != cell.posY) {
                    if (this.cellArray[coordX][coordY] == undefined) {
                        this.createNewCell(false, false, coordX, coordY);
                    }
                    let newNeighbor = this.cellArray[coordX][coordY];
                    if (!cell.neighborsArray.includes(newNeighbor))
                        cell.neighborsArray.push(newNeighbor);
                }
            }
        }
    }

    private createCellNeighbors(cell: Cell): void {
        if (cell.neighborsArray.length < 8) {
            this.fillNeighborsArrayForCell(cell);
        }
        for (let neighbor of cell.neighborsArray) {
            this.fillNeighborsArrayForCell(neighbor);
        }

    }

    private createNewCell(createAlive: boolean, createNeighbors: boolean, x: number, y: number): void {
        let cell = new Cell(createAlive, x, y, this.context);
        this.cellArray[x][y] = cell;
        if (createAlive) {
            this.appendLivingCell(cell);
            cell.draw();
        }
        if (createNeighbors) {
            this.createCellNeighbors(cell);
        }
    }

    private resetGame(): void {
        this.pauseGame();
        this.iterationNumber = 0;
        this.cellArray = [];
        this.livingCellsArray = [];

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.cellArray = [];
        for (let i = 0; i < this.fieldWidth; i++) {
            this.cellArray[i] = [];
            for (let j = 0; j < this.fieldHeight; j++) {
                this.cellArray[i][j] = undefined;
            }
        }
    }

    // 0 - erase, 1 - draw
    private isDrawing(): number {
        if (this.drawRadio.checked)
            return 1;
        else
            return 0;
    }

    private translateCanvasToFieldCoordinates(offset: number, max: number): number {
        let res = Math.floor(offset / 10);
        if (res < 0)
            res = 0;
        else if (res > max)
            res = max;
        return res;
    }

    private drawPointer(offsetX: number, offsetY: number): void {
        let x = this.translateCanvasToFieldCoordinates(offsetX, this.fieldWidth - 1);
        let y = this.translateCanvasToFieldCoordinates(offsetY, this.fieldHeight - 1);
        this.redrawField();
        this.context.fillStyle = "gray";
        this.context.fillRect(x * 10, y * 10, 10, 10);
    }

    private drawCellOnCanvasCoordinates(offsetX: number, offsetY: number): void {
        let x = this.translateCanvasToFieldCoordinates(offsetX, this.fieldWidth - 1);
        let y = this.translateCanvasToFieldCoordinates(offsetY, this.fieldHeight - 1);
        if (this.isDrawing())
            this.setAliveCell(x, y);
        else
            this.setDeadCell(x, y);
    }

    private onCanvasClick(event: MouseEvent): void {
        if (event.type == "mousedown") {
            this.mouseIsHeld = true;
            this.drawCellOnCanvasCoordinates(event.offsetX, event.offsetY);
        } else if (event.type == "mouseup") {
            this.mouseIsHeld = false;
        } else if (event.type == "mousemove") {
            if (this.isDrawing()) {
                if (this.mouseIsHeld) {
                    this.drawCellOnCanvasCoordinates(event.offsetX, event.offsetY);
                } else {
                    this.drawPointer(event.offsetX, event.offsetY);
                }
            } else {
                if (this.mouseIsHeld) {
                    this.drawCellOnCanvasCoordinates(event.offsetX, event.offsetY);
                }
                this.drawPointer(event.offsetX, event.offsetY);
            }
        }
    }

    // 0 - created new, 1 - cell was alive, 2 - cell was dead
    private setAliveCell(x: number, y: number): number {
        let cell = this.cellArray[x][y];
        if (cell == undefined) {
            this.createNewCell(true, true, x, y);
            return 0;
        } else {
            if (!cell.isAlive) {
                cell.resurrect();
                this.createCellNeighbors(cell);
                this.appendLivingCell(cell);
                cell.draw();
                return 2;
            } else {
                return 1;
            }
        }
    }
    private setDeadCell(x: number, y: number): number {
        let cell = this.cellArray[x][y];
        if (cell == undefined) {
            this.createNewCell(false, true, x, y);
            return 0;
        } else {
            if (cell.isAlive) {
                cell.die();
                this.createCellNeighbors(cell);
                this.removeLivingCell(cell);
                this.redrawField();
                return 1;
            } else
                return 2;
        }
    }

    private populateWithFlyers(): void {
        this.resetGame();
        this.setAliveCell(3, 3);
        this.setAliveCell(4, 4);
        this.setAliveCell(5, 2);
        this.setAliveCell(5, 3);
        this.setAliveCell(5, 4);

        this.setAliveCell(8, 3);
        this.setAliveCell(9, 4);
        this.setAliveCell(10, 2);
        this.setAliveCell(10, 3);
        this.setAliveCell(10, 4);

        this.setAliveCell(13, 3);
        this.setAliveCell(14, 4);
        this.setAliveCell(15, 2);
        this.setAliveCell(15, 3);
        this.setAliveCell(15, 4);

        this.setAliveCell(18, 3);
        this.setAliveCell(19, 4);
        this.setAliveCell(20, 2);
        this.setAliveCell(20, 3);
        this.setAliveCell(20, 4);
        this.redrawField();
    }

    private randomlyPopulateField(): void {
        this.resetGame();
        let totalCellCount = this.fieldWidth * this.fieldHeight;
        let percentage = 0.4;
        let amountToPopulate = Math.floor(totalCellCount * percentage);

        let perfArray = [];
        for (let i = 0; i < amountToPopulate; i++) {
            let randomX = this.GetRandomNumber(0, this.fieldWidth - 1);
            let randomY = this.GetRandomNumber(0, this.fieldHeight - 1);

            let res = this.setAliveCell(randomX, randomY);
            if (res == 1)
                i--;
        }
    }

    private GetRandomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}

const game = new Game(60, 50);