const Batch = require('../models/Batch');
const Student = require('../models/Student'); // Add this import

const checkInstallments = async () => {
  try {
    // Get all batches
    const batches = await Batch.find({});

    for (const batch of batches) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find the current installment date index
      const currentInstallmentIndex = batch.installmentDates.findIndex(date => {
        const installmentDate = new Date(date);
        installmentDate.setHours(0, 0, 0, 0);
        return installmentDate.getTime() === today.getTime();
      });

      if (currentInstallmentIndex !== -1) {
        // Get all students in this batch
        const batchStudents = await Student.find({
          'teachersInfo.batchId': batch._id
        });

        for (const student of batchStudents) {
          const expectedInstallmentNumber = currentInstallmentIndex + 1;
          
          // Find student's payment record
          const studentPayment = batch.studentPayments.find(
            sp => sp.student.toString() === student._id.toString()
          );

          // Check if payment exists and is approved
          const installmentPayment = studentPayment?.payments?.find(
            p => p.installmentNumber === expectedInstallmentNumber && p.status === 'approved'
          );

          if (!installmentPayment) {
            // Check if student is already locked
            const isAlreadyLocked = batch.lockedStudents.some(
              ls => ls.studentId.toString() === student._id.toString()
            );

            if (!isAlreadyLocked) {
            //   console.log(`Locking student ${student.name} (${student._id}) for missing installment ${expectedInstallmentNumber}`);
              
              // Lock the student
              batch.lockedStudents.push({
                studentId: student._id,
                lockedAt: new Date()
              });
            }
          }
        }

        // Save batch if changes were made
        if (batch.isModified('lockedStudents')) {
          await batch.save();
          // console.log(`Batch ${batch.name} updated with locked students`);
        }
      }
    }
  } catch (error) {
    console.error('Error checking installments:', error);
  }
};

module.exports = checkInstallments;
