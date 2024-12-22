export class BigNumber {
    private value: number;
    private suffix: string;
  
    // Алфавит для суффиксов
    private static SUFFIXES = ["", "K", "M", "B", "T", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "aa"];
  
    constructor(value: number, suffix = "") {
      this.value = this.roundValue(value);
      this.suffix = suffix;
    }

    public toNumber(): number {
      return this.value;
    }

    public getSuffix(): string {
      return this.suffix;
    }
  
    // Метод форматирования
    public toString(): string {
      return `${Math.floor(this.value)}${this.suffix}`;
    }
  
    static isBigNumber(value: any): value is BigNumber {
      return value instanceof BigNumber;
    }

    private roundValue(value: number): number {
      return Math.round(value * 1000) / 1000;
    }

    public multiply(factor: number): BigNumber {
      let newValue = this.roundValue(this.value * Math.pow(2, factor));
      let suffixIndex = BigNumber.SUFFIXES.indexOf(this.suffix);
  
      while (newValue >= 1000 && suffixIndex < BigNumber.SUFFIXES.length - 1) {
        newValue = this.roundValue(newValue / 1000);
        suffixIndex++;
      }
  
      return new BigNumber(newValue, BigNumber.SUFFIXES[suffixIndex]);
    }

    public divide(factor: number): BigNumber {
      let newValue = this.roundValue(this.value / Math.pow(2, factor));
      let suffixIndex = BigNumber.SUFFIXES.indexOf(this.suffix);
    
      while (newValue < 1 && suffixIndex > 0) {
        newValue = this.roundValue(newValue * 1000);
        suffixIndex--;
      }
    
      return new BigNumber(newValue, BigNumber.SUFFIXES[suffixIndex]);
    }
    
  
    // Методы сравнения для доступных блоков
    public greaterThan(other: BigNumber): boolean {
      if (this.suffix !== other.suffix) {
        return BigNumber.SUFFIXES.indexOf(this.suffix) > BigNumber.SUFFIXES.indexOf(other.suffix);
      }
      return this.value > other.value;
    }

    public lessThan(other: BigNumber): boolean {
      if (this.suffix !== other.suffix) {
        return BigNumber.SUFFIXES.indexOf(this.suffix) < BigNumber.SUFFIXES.indexOf(other.suffix);
      }
      return this.value < other.value;
    }

    public equals(other: BigNumber): boolean {
      const thisIntegerPart = Math.floor(Number(this.value));
      const otherIntegerPart = Math.floor(Number(other.value));
      
      //Getting only int part cause sometimes numbers double value ain't equals, though suffix and int part eq
      return thisIntegerPart === otherIntegerPart && this.suffix === other.suffix;
  }

  }
  