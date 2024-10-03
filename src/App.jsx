import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

function App() {
  const [people, setPeople] = useState([]);
  const [openPerson, setOpenPerson] = useState(null);
  const [debtsDialogOpen, setDebtsDialogOpen] = useState(false);

  const addPerson = (name) => {
    setPeople([...people, { name, items: [], payments: [], debt: 0 }]);
  };

  const addItem = (personIndex, itemName, value) => {
    const updatedPeople = [...people];
    updatedPeople[personIndex].items.push({ name: itemName, value: parseFloat(value) });
    setPeople(updatedPeople);
  };

  const addPayment = (personIndex, amount) => {
    const updatedPeople = [...people];
    updatedPeople[personIndex].payments.push(parseFloat(amount));
    setPeople(updatedPeople);
  };

  const removeItem = (personIndex, itemIndex) => {
    const updatedPeople = [...people];
    updatedPeople[personIndex].items.splice(itemIndex, 1);
    setPeople(updatedPeople);
  };

  const removePayment = (personIndex, paymentIndex) => {
    const updatedPeople = [...people];
    updatedPeople[personIndex].payments.splice(paymentIndex, 1);
    setPeople(updatedPeople);
  };

  const deletePerson = (index) => {
    setPeople(people.filter((_, i) => i !== index));
    setOpenPerson(null);
  };

  const calculateDebts = () => {
    let totalSpent = 0, totalPaid = 0;
    const debtMap = {};

    people.forEach(person => {
      const spent = person.items.reduce((acc, item) => acc + item.value, 0);
      const paid = person.payments.reduce((acc, pay) => acc + pay, 0);
      debtMap[person.name] = paid - spent;
      totalSpent += spent;
      totalPaid += paid;
    });

    if (Math.abs(totalSpent - totalPaid) > 0.01) return { error: "Totals do not match" };

    const creditors = [], debtors = [];
    for (let [name, amount] of Object.entries(debtMap)) {
      if (amount > 0) creditors.push({ name, amount });
      else if (amount < 0) debtors.push({ name, amount: Math.abs(amount) });
    }

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const debts = [];
    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const debt = Math.min(creditors[i].amount, debtors[j].amount);
      debts.push({ from: debtors[j].name, to: creditors[i].name, amount: debt });
      creditors[i].amount -= debt;
      debtors[j].amount -= debt;
      if (creditors[i].amount === 0) i++;
      if (debtors[j].amount === 0) j++;
    }

    return { debts };
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Split Bill App</CardTitle>
        </CardHeader>
        <CardContent>
          <InputForm onSubmit={addPerson} placeholder="Enter name" buttonText="Add Person" />
          {people.map((person, index) => (
            <PersonCard key={index} person={person} onClick={() => setOpenPerson(index)} />
          ))}
        </CardContent>
        <CardFooter>
          <Button onClick={() => setDebtsDialogOpen(true)}>Debts</Button>
        </CardFooter>
      </Card>

      {openPerson !== null && (
        <PersonProfileDialog 
          person={people[openPerson]} 
          onClose={() => setOpenPerson(null)}
          onAddItem={(item, value) => addItem(openPerson, item, value)}
          onAddPayment={amount => addPayment(openPerson, amount)}
          onRemoveItem={(itemIndex) => removeItem(openPerson, itemIndex)}
          onRemovePayment={(paymentIndex) => removePayment(openPerson, paymentIndex)}
          onDelete={() => deletePerson(openPerson)}
        />
      )}

      <DebtsDialog 
        isOpen={debtsDialogOpen} 
        onClose={() => setDebtsDialogOpen(false)} 
        debts={calculateDebts()}
      />
    </div>
  );
}

function InputForm({ onSubmit, placeholder, buttonText }) {
  const [value, setValue] = useState('');
  return (
    <div className="flex mb-4">
      <Input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} />
      <Button onClick={() => { onSubmit(value); setValue(''); }}>{buttonText}</Button>
    </div>
  );
}

function PersonCard({ person, onClick }) {
  const debt = person.items.reduce((acc, item) => acc + item.value, 0) - 
                person.payments.reduce((acc, pay) => acc + pay, 0);
  return (
    <div onClick={onClick} className="p-2 mb-2 bg-white rounded cursor-pointer hover:bg-gray-100">
      <span>{person.name}</span>
      <span className={`ml-2 ${debt < 0 ? 'text-red-500' : 'text-green-500'}`}>
        {debt < 0 ? `Owes $${Math.abs(debt).toFixed(2)}` : `Is owed $${debt.toFixed(2)}`}
      </span>
    </div>
  );
}

function PersonProfileDialog({ person, onClose, onAddItem, onAddPayment, onRemoveItem, onRemovePayment, onDelete }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{person.name}'s Profile</DialogTitle>
        </DialogHeader>
        <InputForm onSubmit={(item) => onAddItem(item, '0')} placeholder="Item name" buttonText="Add Item" />
        <InputForm onSubmit={(amount) => onAddPayment(amount)} placeholder="Payment amount" buttonText="Add Payment" />
        <div>
          <h3 className="mt-4">Items:</h3>
          {person.items.map((item, idx) => (
            <div key={idx} className="flex justify-between p-2">
              <span>{item.name}</span>
              <span>${item.value.toFixed(2)}</span>
              <Button variant="destructive" size="icon" onClick={() => onRemoveItem(idx)}>X</Button>
            </div>
          ))}
          <h3>Payments:</h3>
          {person.payments.map((payment, idx) => (
            <div key={idx} className="flex justify-between p-2">
              <span>Payment</span>
              <span>${payment.toFixed(2)}</span>
              <Button variant="destructive" size="icon" onClick={() => onRemovePayment(idx)}>X</Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onDelete}>Delete Person</Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DebtsDialog({ isOpen, onClose, debts }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Debts</DialogTitle>
        </DialogHeader>
        {debts.error ? 
          <p className="text-red-500">{debts.error}</p> : 
          debts.debts.map((debt, idx) => (
            <div key={idx} className="mb-2">
              {debt.from} owes {debt.to} ${debt.amount.toFixed(2)}
            </div>
          ))}
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default App;