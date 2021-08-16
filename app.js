const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(5500, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertTodoToJson = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const hasStatus = (status) => {
  return status !== undefined;
};

const hasPriority = (priority) => {
  return priority !== undefined;
};

const hasStatusAndPriority = (status, priority) => {
  return status !== undefined && priority !== undefined;
};

const hasCategoryAndStatus = (category, status) => {
  return category !== undefined && status !== undefined;
};

const hasCategory = (category) => {
  return category !== undefined;
};

const hasCategoryAndPriority = (category, priority) => {
  return category !== undefined && priority !== undefined;
};
const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
const priorityArray = ["HIGH", "MEDIUM", "LOW"];
const categoryArray = ["WORK", "HOME", "LEARNING"];

const formatDate = (date) => {
  let formattedDate = format(new Date(date), "yyyy-MM-dd");
  return formattedDate;
};

app.get("/todos", async (request, response) => {
  let { priority, status, category, search_q = "" } = request.query;
  let getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`;
  if (hasStatusAndPriority(status, priority) === true) {
    if (statusArray.includes(status) && priorityArray.includes(priority)) {
      getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}' AND todo LIKE '%${search_q}%'`;
      const todos = await database.all(getTodosQuery);
      response.send(todos.map((todo) => convertTodoToJson(todo)));
    } else if (
      statusArray.includes(status) &&
      !priorityArray.includes(priority)
    ) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (
      !statusArray.includes(status) &&
      priorityArray.includes(priority)
    ) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      response.send("Invalid Todo Status and Priority");
    }
  } else if (hasCategoryAndStatus(category, status) === true) {
    if (categoryArray.includes(category) && statusArray.includes(status)) {
      getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND category = '${category}' AND todo LIKE '%${search_q}%'`;
      const todos = await database.all(getTodosQuery);
      response.send(todos.map((todo) => convertTodoToJson(todo)));
    } else if (
      categoryArray.includes(category) &&
      !statusArray.includes(status)
    ) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else if (
      !categoryArray.includes(category) &&
      statusArray.includes(status)
    ) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      response.status(400);
      response.send("Invalid Status and Category");
    }
  } else if (hasCategoryAndPriority(category, priority) === true) {
    if (categoryArray.includes(category) && priorityArray.includes(priority)) {
      getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}' AND todo LIKE '%${search_q}%'`;
      const todos = await database.all(getTodosQuery);
      response.send(todos.map((todo) => convertTodoToJson(todo)));
    } else if (
      categoryArray.includes(category) &&
      !priorityArray.includes(priority)
    ) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (
      !categoryArray.includes(category) &&
      priorityArray.includes(priority)
    ) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      response.status(400);
      response.send("Invalid Todo Category and Priority");
    }
  } else if (hasCategory(category) === true) {
    if (categoryArray.includes(category)) {
      getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND todo LIKE '%${search_q}%'`;
      const todos = await database.all(getTodosQuery);
      response.send(todos.map((todo) => convertTodoToJson(todo)));
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (hasPriority(priority) === true) {
    if (priorityArray.includes(priority)) {
      getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND todo LIKE '%${search_q}%'`;
      const todos = await database.all(getTodosQuery);
      response.send(todos.map((todo) => convertTodoToJson(todo)));
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (hasStatus(status) === true) {
    if (statusArray.includes(status)) {
      getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND todo LIKE '%${search_q}%'`;
      const todos = await database.all(getTodosQuery);
      response.send(todos.map((todo) => convertTodoToJson(todo)));
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    const todos = await database.all(getTodosQuery);
    response.send(todos.map((todo) => convertTodoToJson(todo)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};
    `;
  const todo = await database.get(getTodoQuery);
  response.send(convertTodoToJson(todo));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  if (date === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const formattedDate = formatDate(date);
    const isDateValid = isValid(new Date(formattedDate));
    if (isDateValid) {
      const getDueDateTodo = `
    SELECT
      *
    FROM
      todo
    WHERE due_date = '${formattedDate}';
    `;
      const todos = await database.all(getDueDateTodo);
      response.send(todos.map((todo) => convertTodoToJson(todo)));
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  try {
    const formattedDate = formatDate(dueDate);
    const isDateValid = isValid(new Date(formattedDate));

    if (!statusArray.includes(status)) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (!priorityArray.includes(priority)) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (!categoryArray.includes(category)) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else if (isDateValid !== true) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      const postTodoQuery = `
    INSERT INTO
      todo (id,todo,priority,status,category,due_date) 
    VALUES (
      ${id},'${todo}','${priority}','${status}','${category}','${formattedDate}'
    );
    `;
      await database.run(postTodoQuery);
      response.send("Todo Successfully Added");
    }
  } catch (e) {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  let formattedDate;
  switch (true) {
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.status !== undefined:
      if (!statusArray.includes(requestBody.status)) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        updateColumn = "Status";
      }
      break;
    case requestBody.priority !== undefined:
      if (!priorityArray.includes(requestBody.priority)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        updateColumn = "Priority";
      }
      break;
    case requestBody.category !== undefined:
      if (!categoryArray.includes(requestBody.category)) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        updateColumn = "Category";
      }
      break;
    case requestBody.dueDate !== undefined:
      try {
        formattedDate = formatDate(requestBody.dueDate);
        const isDateValid = isValid(new Date(formattedDate));
        if (isDateValid === false) {
          response.status(400);
          response.send("Invalid Due Date");
        } else {
          updateColumn = "Due Date";
        }
      } catch (e) {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
  if (updateColumn !== "") {
    const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId}`;
    const previousTodo = await database.get(previousTodoQuery);
    const {
      todo = previousTodo.todo,
      status = previousTodo.status,
      priority = previousTodo.priority,
      category = previousTodo.category,
      dueDate = previousTodo.due_date,
    } = request.body;
    const updateTodoQuery = `
      UPDATE
        todo
      SET
        todo = '${todo}',
        status = '${status}',
        priority = '${priority}',
        category = '${category}',
        due_date = '${formattedDate}'
      WHERE
        id = ${todoId}
      `;
    await database.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};
    `;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryandStatusproperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryandPriorityproperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", category, priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasCategoryandStatusproperty(request.query):
      getTodosQuery = `
        SELECT 
        *
        FROM
        todo
        WHERE 
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND category = '${category}';
        `;
      break;
    case hasCategoryandPriorityproperty(request.query):
      getTodosQuery = `
            SELECT 
            *
            FROM 
            todo
            where
            todo LIKE '${search_q}'
            AND category = '${category}'
            AND priority = '${priority}
            
            `;
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
            SELECT
            *
            FROM
            todo
            WHERE 
            todo LIKE '${search_q}'
            AND category = '${category}'`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
            todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  if (data.status === undefined) {
    response.send(400);
    response.send("Invalid Todo Status");
  }
  if (data.priority === undefined) {
    response.send(400);
    response.send("Invalid Todo Priority");
  }
  if (data.category === undefined) {
    response.send(400);
    response.send("Invalid Todo Category");
  }
  if (data.due_date === undefined) {
    response.send(400);
    response.send("Invalid Todo Due Date");
  }

  if (data !== undefined) {
    response.send(data);
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

app.get("/agenda/", async (request, response) => {
  const date = format(new Date(2021, 02, 22), "yyyy-MM-dd");
  const getAgendaQuery = `SELECT * FROM todo WHERE due_date = '${date}'`;
  const result = await database.get(getAgendaQuery);
  response.send(result);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, category, priority, status, due_date } = request.body;
  const postTodoQuery = `
  INSERT INTO 
  todo (id, todo, category, priority, status, due_date)
  VALUES ('${id}', '${todo}', '${category}', '${priority}', '${status}', "${due_date}')`;
  const result1 = await database.run(postTodoQuery);
  response.send(result1);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
