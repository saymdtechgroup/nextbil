import re

with open("src/components/BuyTokenModal.tsx", "r") as f:
    content = f.read()

# Make sure we don't block the UI if the fetch calls in onConfirmPurchase fail
target = """    onConfirmPurchase(
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
    );

    setIsProcessing(false);
    setPaymentStatusText('');
    setStep(1);"""

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
    } catch(e) {
        console.error("Error finalizing purchase:", e);
    } finally {
        setIsProcessing(false);
        setPaymentStatusText('');
        setStep(1);
    }"""

content = content.replace(target, replace)

with open("src/components/BuyTokenModal.tsx", "w") as f:
    f.write(content)

print("Patched BuyTokenModal.tsx")
