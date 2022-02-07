// Importando o express
const express = require("express");

// Biblioteca gerar uuid aleatorio
const { v4: uuidv4 } = require("uuid");

// Usando o express
const app = express();

// Pacote express aceitar entrar em json
app.use(express.json());

// Array para guardar as informações
const customers = [];

// MiddleWare
function verifyIfExisteAccountCPF(request, response, next){
    // Pegando o request, response e se existir ele manda o next

    // Pegando cpf pelo header
    const { cpf } = request.headers;

    // Validando a existencia
    const customer = customers.find((customer) => customer.cpf === cpf);

    // If para verificar a existencia da conta com o CPF
    if(!customer) {
        return response.status(400).json({ error: "Conta inexistente"});
    }

    // Resgatar dentro da função
    request.customer =  customer;

    // Sinal que pode proseguir o processo
    return next();
}

// função para gerar o saldo da conta
function getBalance(statement){

    const balance = statement.reduce((acc, operation) => {
        if (operation.type === "credit"){
            return acc + operation.amount
        } else {
            return acc - operation.amount;
        }
    }, 0);
    
    return balance;
}

// Rota para criar a conta
app.post("/account", (request, response) => {

    // Criando variavel da aquisição e o metodo body
    const { cpf, name } = request.body;

    // ID aleatorio
    const id = uuidv4();

    // Validando se o cpf já esta cadastrado
    const customersAlreadeyExists = customers.some(
        (customers) => customers.cpf === cpf
    );

    // If para validar a existencia
    if (customersAlreadeyExists){
        return response.status(400).json({ error: "CPF Já cadastrado"});
    }

    // Atribuindo os valores ao Array
    customers.push ({
        cpf,
        name,
        id: uuidv4(),
        statement: [],
    });

    // Retornando status // error or sucess
    return response.status(201).send();
});

// Criando busca do extrato bancario
app.get("/statement", verifyIfExisteAccountCPF, (request, response) =>{

    // Headers para pegar o CPF da conta que vamos ver o extrato pela url
    const { cpf } = request.headers;

    // buscar a conta do cpf cadastrado
    const customer = customers.find((customer) => customer.cpf === cpf);

    //returnando o extrato se tiver a conta
    return response.json(customer.statement);
});

// Criando rota para deposito
app.post("/deposit", verifyIfExisteAccountCPF, (request, response) =>{
    // Passando as informações
    const { description, amount } =  request.body;

    // Passando as informações para a Conta
    const { customer } =  request;

    //criando as operaçoes
    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    //adicionando valor no array
    customer.statement.push(statementOperation);

    //return o result
    return response.status(201).send();

});

// Criando rota de saque 
app.post("/saque", verifyIfExisteAccountCPF, (request, response) => {

    // Passando as informações
    const { description, amount } =  request.body;

    // Recuperando a conta do cliente
    const { customer } = request;

    // Variavel com o saldo
    const balance = getBalance(customer.statement);
  
    // função para o saque
    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit",
    }

    // Condição para verificar o saldo
    if (balance <  amount){
        return response.status(400).json({ error: "Saldo indisponivel"});
    }

    // Atualizando o valor no arry
    customer.statement.push(statementOperation);

    //retornando resultado
    return response.status(201).send();
});

// Criando extrato por data
app.get("/statement/date", verifyIfExisteAccountCPF, (request, response) =>{

    // Importando a Conta
    const { customer } = request;
    const { date } = request.query;

    // Formatando a data
    const dateFormat = new Date(date + " 00:00");

    // Buscando extrato por data 
    const statement =  customer.statement.find(
        (statement) => 
        statement.created_at.toDateString() === 
        new Date(dateFormat).toDateString());

    //returnando o extrato se tiver a conta
    return response.json(statement);
});

// Atualizandonome da Conta
app.put("/account", verifyIfExisteAccountCPF, (request, response) =>{

    // Nome para ser alterado
    const { name } =  request.body;
    const { customer } =  request;

    // Atualizando o Nome
    customer.name = name;

    return response.status(201).send();
});

// Criando rota para verificar a conta
app.get("/account", verifyIfExisteAccountCPF, (request, response) => {

    // puxando a Conta
    const { customer } =  request;

    // mostrando os dados
    return response.json(customer);

});

//deletar conta
app.delete("/account", verifyIfExisteAccountCPF, (request, response) => {

    // importando conta
    const { customer } = request;

    //Splice
    customers.splice(customer, 1);

    return response.status(200).json(customers);
});

// Retonrnar o Saldo
app.get("/balance", verifyIfExisteAccountCPF, (request, response) => {
    const { customer } =  request;
    
    const balance = getBalance(customer.statement);

    return response.json(balance);
})

app.listen(3000);