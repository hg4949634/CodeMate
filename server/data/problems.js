// 첫 주에는 정적인 학습 문제 네 개만 제공한다.
// 2주차부터 문제 제출 및 기록 저장 기능을 추가할 예정이다.
const problems = [
  {
    id: 1,
    title: '1부터 N까지의 합',
    concept: '반복문',
    difficulty: '쉬움',
    description: '정수 N이 주어졌을 때 1부터 N까지의 합을 구하는 프로그램을 작성해 보세요.',
    starterCode: '#include <stdio.h>\n\nint main(void) {\n    int n = 10;\n    int sum = 0;\n    // TODO: 반복문을 작성해 보세요.\n    printf("%d\\n", sum);\n    return 0;\n}',
  },
  {
    id: 2,
    title: '배열 원소의 합',
    concept: '배열',
    difficulty: '쉬움',
    description: '정수 배열의 원소를 모두 더해 결과를 출력해 보세요.',
    starterCode: '#include <stdio.h>\n\nint main(void) {\n    int arr[5] = {1, 2, 3, 4, 5};\n    int sum = 0;\n    // TODO: 배열의 모든 값을 더해 보세요.\n    printf("%d\\n", sum);\n    return 0;\n}',
  },
  {
    id: 3,
    title: '문자열 길이 구하기',
    concept: '문자열',
    difficulty: '보통',
    description: '널 종료 문자를 제외한 문자열의 길이를 계산해 보세요.',
    starterCode: '#include <stdio.h>\n\nint main(void) {\n    char word[] = "hello";\n    int length = 0;\n    // TODO: 길이를 계산해 보세요.\n    printf("%d\\n", length);\n    return 0;\n}',
  },
  {
    id: 4,
    title: '포인터로 값 변경하기',
    concept: '포인터',
    difficulty: '보통',
    description: '포인터를 이용해 변수의 값을 변경하고 출력해 보세요.',
    starterCode: '#include <stdio.h>\n\nint main(void) {\n    int value = 5;\n    int *ptr = &value;\n    // TODO: ptr을 통해 value를 10으로 바꿔 보세요.\n    printf("%d\\n", value);\n    return 0;\n}',
  },
];

export default problems;
