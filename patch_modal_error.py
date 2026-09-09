import re

with open("src/components/BuyTokenModal.tsx", "r") as f:
    content = f.read()

target = """    try {
        // Execute the confirmation asynchronously without blocking the modal closing
        await Promise.resolve(onConfirmPurchase(
          tokenQuantity,
          usdValue,
          {
            p2Percent,
            p3Percent,
            p4Percent,
            p5Percent,
            dexPercent,
            unallocatedPercent,
          },
          currency
        ));
    } catch(e) {
        console.error("Error finalizing purchase:", e);
    } finally {
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

replace = """    try {
        // Execute the confirmation asynchronously without blocking the modal closing
        await Promise.resolve(onConfirmPurchase(
          tokenQuantity,
          usdValue,
          {
            p2Percent,
            p3Percent,
            p4Percent,
            p5Percent,
            dexPercent,
            unallocatedPercent,
          },
          currency
        ));
        
        // Success Path
        setIsProcessing(false);
        setPaymentStatusText('');
        setStep(1);

        if (typeof confetti === 'function') {
            confetti({
              particleCount: 120,
              spread: 90,
              origin: { y: 0.5 },
              colors: ['#F59E0B', '#E879F9', '#10B981', '#38BDF8'],
            });
        }
        
        if (typeof onClose === 'function') {
            onClose();
        }
    } catch(e: any) {
        console.error("Error finalizing purchase:", e);
        setTxErrorMessage(e?.message || "Failed to finalize purchase. Please contact support.");
        setIsProcessing(false);
        setPaymentStatusText('');
        return; // Abort closing the modal so user can read the error
    }
  };"""

content = content.replace(target, replace)

with open("src/components/BuyTokenModal.tsx", "w") as f:
    f.write(content)

print("Patched BuyTokenModal.tsx error handling")
