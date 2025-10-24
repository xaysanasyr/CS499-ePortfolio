/**
 * 
 */

/**
 * @author rikkixaysanas_snhu
 *
 */
import java.util.Scanner;

public class PetCheckIn {
	public Scanner input = new Scanner(System.in);
	public String petType;
	public String petName;
	public int petAge;
	public int dogSpaces = 30;
	public int catSpaces = 12;
	public int daysStay;
	public double amountDue;
	
	//Constructor with parameters
	public PetCheckIn(String petType, String petName, int petAge, int dogSpaces, int catSpaces, int daysStay, double amountDue) {
		this.petType = petType;
		this.petName = petName;
		this.petAge = petAge;
		this.dogSpaces = dogSpaces;
		this.catSpaces = catSpaces;
		this.daysStay = daysStay;
		this.amountDue = amountDue;
	}
	//Assessor Method to call PetType and Return
	public String getPetType() {
		return petType;
	}
		//Mutator Method for PetType;sets value
	public void setPetType() {
		System.out.println("Enter pet type: ");
		String petType = input.nextLine();
		if (petType == "dog"){
			this.petType = "dog";
			System.out.println("You have choosen" + this.petType);
		}
		else if (petType == "cat"){
			this.petType = "dog";
			System.out.println("You have choosen" + this.petType);
		}
		else {
			System.out.println("Error... make sure to input lowercase dog or cat");
		}
	}
	
	public int getPetAge() {
		return petAge;
	}
	public void setPetAge() {
		System.out.println("How old is your pet? (years): ");
		int petAge = input.nextInt();
		System.out.println("Pet age is" + getPetAge());
	}
	
	
	public String getPetName() {
		return petName;
	}
	public void setPetName() {
		System.out.println("What is your pets name?");
		String petName = input.nextLine();
		System.out.println("Welcome! " + getPetName());
	}
	public int getDogSpaces() {
		return dogSpaces;
	}
	public void setDogSpaces(int dogSpaces) {
		this.dogSpaces = dogSpaces;
	}
	public int getCatSpaces() {
		return catSpaces;
	}
	public void setCatSpaces(int catSpaces) {
		this.catSpaces = catSpaces;
	}
	public int getDaysStay() {
		return daysStay;
	}
	public void setDaysStay(int daysStay) {
		this.daysStay = daysStay;
	}
	public double getAmountDue() {
		return amountDue;
	}
	public void setAmountDue(double amountDue) {
		this.amountDue = amountDue;
	}

	/**
	 * @param args
	 */
	public static void main(String[] args) {
		// TODO Auto-generated method stub

	}

}
