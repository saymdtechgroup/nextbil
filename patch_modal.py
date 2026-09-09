import re

with open("src/components/BuyTokenModal.tsx", "r") as f:
    content = f.read()

target = """    } finally {
        setIsProcessing(false);
        setPaymentStatusText('');
        setStep(1);
    }

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#F59E0B', '#E879F9', '#10B981', '#38BDF8'],
    });

    onClose();
  };"""

replace = """    } finally {
        setIsProcessing(false);
        setPaymentStatusText('');
        setStep(1);
    }

    try {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#F59E0B', '#E879F9', '#10B981', '#38BDF8'],
        });
      }
    } catch(err) {
      console.error("Confetti error", err);
    }

    try {
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch(err) {
      console.error("onClose error", err);
    }
  };"""

content = content.replace(target, replace)

with open("src/components/BuyTokenModal.tsx", "w") as f:
    f.write(content)
print("Patched BuyTokenModal.tsx")
