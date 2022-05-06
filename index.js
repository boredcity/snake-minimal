const main = () => {
    const sideLength = +(localStorage.getItem('side-length') ?? 8);
    const initialMoveDelay = +(localStorage.getItem('initial-delay') ?? 500);
    const minMoveDelay = +(localStorage.getItem('min-delay') ?? 200);

    // handle initial values change
    const minSideLength = 2;
    const maxSideLength = 30;
    const sideLengthEl = document.getElementById('side');
    sideLengthEl.innerText = sideLength;
    const initialMoveDelayEl = document.getElementById('initial-delay');
    initialMoveDelayEl.innerText = initialMoveDelay;
    const minMoveDelayEl = document.getElementById('min-delay');
    minMoveDelayEl.innerText = minMoveDelay;
    sideLengthEl.onblur = evt => {
        const value = +evt.target.innerText;
        if (
            Number.isNaN(value) ||
            value < minSideLength ||
            value > maxSideLength
        ) {
            sideLengthEl.innerHTML = sideLength;
            return;
        }
        if (value !== sideLength) {
            localStorage.setItem('side-length', value);
            window.location.reload();
        }
    };

    initialMoveDelayEl.onblur = evt => {
        const value = +evt.target.innerText;
        if (Number.isNaN(value) || value < 50 || value > 1000) {
            initialMoveDelayEl.innerHTML = initialMoveDelay;
            return;
        }
        if (value !== initialMoveDelay) {
            if (minMoveDelay > value) localStorage.setItem('min-delay', value);
            localStorage.setItem('initial-delay', value);
            window.location.reload();
        }
    };

    minMoveDelayEl.onblur = evt => {
        const value = +evt.target.innerText;
        if (Number.isNaN(value) || value < 50 || value > initialMoveDelay) {
            minMoveDelayEl.innerHTML = minMoveDelay;
            return;
        }
        if (value !== minMoveDelay) {
            localStorage.setItem('min-delay', value);
            window.location.reload();
        }
    };

    const LEFT = 'LEFT';
    const TOP = 'TOP';
    const RIGHT = 'RIGHT';
    const BOTTOM = 'BOTTOM';

    const moveDelayDelta = initialMoveDelay - minMoveDelay;
    const emptyField = Array(sideLength)
        .fill(null)
        .map(_ => Array(sideLength).fill(null));

    const getCurrentMoveDelay = score =>
        initialMoveDelay - moveDelayDelta * (score / (sideLength ** 2 - 1));

    const getNewHead = ([curRow, curCell], direction) => {
        if (direction === RIGHT) {
            let newCell = curCell + 1;
            if (newCell === emptyField[0].length) newCell = 0;
            return [curRow, newCell];
        } else if (direction === LEFT) {
            let newCell = curCell - 1;
            if (newCell < 0) newCell = emptyField[0].length - 1;
            return [curRow, newCell];
        } else if (direction === BOTTOM) {
            let newRow = curRow + 1;
            if (newRow === emptyField.length) newRow = 0;
            return [newRow, curCell];
        } else if (direction === TOP) {
            let newRow = curRow - 1;
            if (newRow < 0) newRow = emptyField.length - 1;
            return [newRow, curCell];
        } else {
            throw new Error(`Unknown direction ${direction}`);
        }
    };

    const isValidDirection = (...directions) => {
        return !(
            directions[0] === directions[1] ||
            directions.every(d => [LEFT, RIGHT].includes(d)) ||
            directions.every(d => [TOP, BOTTOM].includes(d))
        );
    };

    const copyField = field => [...field.map(arr => [...arr])];

    const renderField = field => {
        const fieldString = field
            .map(arr => arr.map(val => (val === null ? '.' : val)).join(' '))
            .join('\n');
        document.getElementById('field').textContent = fieldString;
    };

    const renderScore = score =>
        (document.getElementById('score').textContent = score);

    const randomUpTo = max => Math.floor(Math.random() * max);

    const getUnoccupiedCell = fieldWithSnake => {
        const options = [];
        for (let rowI = 0; rowI < fieldWithSnake.length; rowI++) {
            for (let cellI = 0; cellI < fieldWithSnake[0].length; cellI++) {
                if (fieldWithSnake[rowI][cellI]) continue;
                options.push([rowI, cellI]);
            }
        }
        return options[randomUpTo(options.length)];
    };

    const fruits = 'YOUAREAMAZINGSTRONGBRAVEANDWONDERFULREMEMBERTHATTODAY';
    const getRandomFruit = score => fruits[score % fruits.length];

    let score = 0;
    let timeoutId;
    let direction = RIGHT;
    let fieldWithoutSnake = copyField(emptyField);
    const snake = [getUnoccupiedCell(fieldWithoutSnake)];

    document.body.onkeydown = ev => {
        if (timeoutId) {
            if (ev.key === ' ') {
                clearTimeout(timeoutId);
                timeoutId = undefined;
                return;
            }
            const newDirection = {
                ArrowRight: RIGHT,
                ArrowLeft: LEFT,
                ArrowUp: TOP,
                ArrowDown: BOTTOM
            }[ev.key];

            if (newDirection && isValidDirection(direction, newDirection))
                direction = newDirection;
            return;
        }
        if (ev.key === ' ')
            timeoutId = setTimeout(makeMove, getCurrentMoveDelay(score));
    };

    const makeMove = (forceCreateFruit = false) => {
        const fieldWithSnake = copyField(fieldWithoutSnake);
        const [headRow, headCell] = getNewHead(snake[0], direction);
        const newHead = fieldWithoutSnake[headRow][headCell];
        let ateFruit = false;
        if (newHead) {
            ateFruit = true;
            score++;
            renderScore(score);
            fieldWithoutSnake[headRow][headCell] = null;
        }

        if (!ateFruit) snake.pop();
        snake.unshift([headRow, headCell]);

        let isFirst = true;
        for (const [blockRow, blockCell] of snake) {
            if (fieldWithSnake[blockRow][blockCell] === '@') {
                if (confirm(`Game over. Score: ${score}! Try again?`))
                    window.location.reload();
                return;
            }
            fieldWithSnake[blockRow][blockCell] = isFirst ? '@' : '#';
            isFirst = false;
        }

        if (forceCreateFruit || ateFruit) {
            const fruitLocation = getUnoccupiedCell(fieldWithSnake);
            if (!fruitLocation) {
                if (confirm(`You won. Score: ${score}! Try again?`))
                    window.location.reload();
                return;
            }
            const [rowI, cellI] = fruitLocation;
            const fruit = getRandomFruit(score);
            fieldWithoutSnake[rowI][cellI] = fruit;
            fieldWithSnake[rowI][cellI] = fruit;
        }

        renderField(fieldWithSnake);

        timeoutId = setTimeout(makeMove, getCurrentMoveDelay(score));
    };

    makeMove(true);
};
main();
