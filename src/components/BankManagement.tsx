import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, Landmark } from "lucide-react";

interface BankManagementProps {
  onDeposit: (amount: number) => Promise<void>;
  onWithdraw: (amount: number) => Promise<void>;
  disabled: boolean;
}

export const BankManagement = ({
  onDeposit,
  onWithdraw,
  disabled,
}: BankManagementProps) => {
  const [amount, setAmount] = useState(0);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const handleConfirmDeposit = async () => {
    if (amount > 0) {
      await onDeposit(amount);
      setIsDepositOpen(false);
      setAmount(0);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (amount > 0) {
      await onWithdraw(amount);
      setIsWithdrawOpen(false);
      setAmount(0);
    }
  };

  return (
    <Card className="glass-effect border-primary/20 animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-primary" />
          Gerenciamento de Banca
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full bg-green-500 hover:bg-green-600"
              disabled={disabled}
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              Depositar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Realizar Depósito</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="deposit-amount">Valor do Depósito (R$)</Label>
              <Input
                id="deposit-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount || ""}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                className="font-mono-numbers"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setAmount(0)}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button onClick={handleConfirmDeposit} disabled={amount <= 0}>
                Confirmar Depósito
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full"
              variant="destructive"
              disabled={disabled}
            >
              <ArrowDown className="w-4 h-4 mr-2" />
              Sacar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Realizar Saque</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="withdraw-amount">Valor do Saque (R$)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount || ""}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                className="font-mono-numbers"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setAmount(0)}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleConfirmWithdraw}
                disabled={amount <= 0}
              >
                Confirmar Saque
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
